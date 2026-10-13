import logging
import os
from datetime import datetime, timezone, timedelta
from django.utils import timezone as dj_timezone
from django.db import transaction
from ..models import UserProfile, DailyQuotaRecord
from ..redis_client import redis_client

logger = logging.getLogger(__name__)

GUEST_DAILY_LIMIT = int(os.environ.get("GUEST_DAILY_LIMIT", "3"))
FREE_DAILY_LIMIT = 10

GUEST_LIMIT_MESSAGE = (
    f"You've reached your daily limit of {GUEST_DAILY_LIMIT} free links. "
    "Create a free account or Continue with Google to shorten up to 10 links per day."
)

FREE_LIMIT_MESSAGE = (
    "You've reached your free daily limit of 10 links. "
    "Upgrade to Pro for unlimited daily shortening, custom aliases, and advanced analytics."
)


def get_client_ip(request) -> str:
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "") or "127.0.0.1"


def get_utc_date_str() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def get_seconds_until_midnight_utc() -> int:
    now_utc = datetime.now(timezone.utc)
    tomorrow_utc = (now_utc + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    seconds = int((tomorrow_utc - now_utc).total_seconds())
    return max(seconds, 60)


def get_next_midnight_utc_iso() -> str:
    now_utc = datetime.now(timezone.utc)
    tomorrow_utc = (now_utc + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return tomorrow_utc.isoformat()


class QuotaService:
    @classmethod
    def get_user_tier_and_limit(cls, user) -> tuple[str, int | None]:
        if not user or not user.is_authenticated:
            return "guest", GUEST_DAILY_LIMIT

        profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                "subscription_tier": UserProfile.TIER_PRO if user.is_superuser else UserProfile.TIER_FREE,
                "is_subscribed": user.is_superuser,
            }
        )

        if profile.is_pro:
            return "pro", None

        return "free", FREE_DAILY_LIMIT

    @classmethod
    def get_quota_key(cls, request) -> tuple[str, str, int | None]:
        today_str = get_utc_date_str()
        user = getattr(request, "user", None)
        tier, limit = cls.get_user_tier_and_limit(user)

        if tier == "guest":
            ip = get_client_ip(request)
            key = f"ratelimit:guest:{ip}:{today_str}"
        elif tier == "free":
            key = f"ratelimit:user:{user.id}:{today_str}"
        else:
            # Pro tier
            key = f"ratelimit:pro:{user.id}:{today_str}"

        return key, tier, limit

    @classmethod
    def get_current_used(cls, key: str) -> int:
        if redis_client:
            try:
                val = redis_client.get(key)
                if val is not None:
                    return int(val)
            except Exception as e:
                logger.warning(f"[Quota] Redis get failed: {e}. Falling back to DB.")

        # Fallback to DailyQuotaRecord
        record = DailyQuotaRecord.objects.filter(key=key).first()
        return record.count if record else 0

    @classmethod
    def increment_usage(cls, key: str) -> int:
        new_count = 1
        ttl = get_seconds_until_midnight_utc()

        if redis_client:
            try:
                pipe = redis_client.pipeline()
                pipe.incr(key)
                pipe.expire(key, ttl)
                results = pipe.execute()
                new_count = int(results[0])
            except Exception as e:
                logger.warning(f"[Quota] Redis incr failed: {e}. Falling back to DB.")
                new_count = cls._increment_db(key)
        else:
            new_count = cls._increment_db(key)

        return new_count

    @classmethod
    def _increment_db(cls, key: str) -> int:
        today_date = dj_timezone.now().date()
        with transaction.atomic():
            record, created = DailyQuotaRecord.objects.select_for_update().get_or_create(
                key=key,
                defaults={"count": 0, "date": today_date}
            )
            record.count += 1
            record.date = today_date
            record.save(update_fields=["count", "date", "updated_at"])
            return record.count

    @classmethod
    def get_quota_info(cls, request) -> dict:
        key, tier, limit = cls.get_quota_key(request)
        used = cls.get_current_used(key)
        resets_at = get_next_midnight_utc_iso()

        if tier == "pro":
            remaining = None
            is_exhausted = False
        else:
            remaining = max(0, limit - used) if limit is not None else None
            is_exhausted = (remaining == 0) if remaining is not None else False

        user = getattr(request, "user", None)
        is_authenticated = bool(user and user.is_authenticated)

        return {
            "tier": tier,
            "limit": limit,
            "used": used,
            "remaining": remaining,
            "is_exhausted": is_exhausted,
            "resets_at": resets_at,
            "is_authenticated": is_authenticated,
        }

    @classmethod
    def check_and_enforce_quota(cls, request) -> tuple[bool, dict]:
        key, tier, limit = cls.get_quota_key(request)

        # Pro tier: unlimited
        if tier == "pro" or limit is None:
            cls.increment_usage(key)
            info = cls.get_quota_info(request)
            return True, info

        used = cls.get_current_used(key)

        # Check if daily limit already reached
        if used >= limit:
            info = cls.get_quota_info(request)
            message = GUEST_LIMIT_MESSAGE if tier == "guest" else FREE_LIMIT_MESSAGE
            info["message"] = message
            return False, info

        # Otherwise allow and increment
        new_used = cls.increment_usage(key)
        info = cls.get_quota_info(request)
        info["used"] = new_used
        if limit is not None:
            info["remaining"] = max(0, limit - new_used)

        return True, info
