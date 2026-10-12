import json
from datetime import timedelta
from django.utils import timezone
from django.http import HttpResponseRedirect, JsonResponse, Http404
from django.db import connection
from django.db.models import Count
from django.db.models.functions import TruncDate
from django.contrib.auth import get_user_model
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import URL, LinkClick
from .serializers import ShortenRequestSerializer, URLResponseSerializer, UserMeSerializer
from .utils.base62 import encode_base62, SEQUENCE_OFFSET
from .redis_client import redis_client

User = get_user_model()

CACHE_TTL = 86400  # 24 hours


def get_client_ip(request) -> str:
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "")


class HealthzView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        status_info = {
            "postgres": "healthy",
            "redis": "healthy",
        }

        # Check DB
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
        except Exception as e:
            status_info["postgres"] = f"unhealthy: {str(e)}"

        # Check Redis
        if redis_client:
            try:
                redis_client.ping()
            except Exception as e:
                status_info["redis"] = f"unhealthy: {str(e)}"
        else:
            status_info["redis"] = "disconnected (fallback mode)"

        all_ok = all("healthy" in v for v in status_info.values())
        return JsonResponse(
            {
                "status": "ok" if all_ok else "degraded",
                "timestamp": timezone.now().isoformat(),
                "services": status_info,
            },
            status=200 if all_ok else 503,
        )


class ShortenView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ShortenRequestSerializer(data=request.data)
        if not serializer.is_valid():
            first_err_key = next(iter(serializer.errors))
            first_err_val = serializer.errors[first_err_key]
            err_msg = first_err_val[0] if isinstance(first_err_val, list) else str(first_err_val)
            return Response(
                {"error": "Bad Request", "message": err_msg, "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data
        original_url = data["original_url"]
        custom_slug = data.get("custom_slug", "").strip()
        expires_in_days = data.get("expires_in_days")

        expires_at = None
        if expires_in_days:
            expires_at = timezone.now() + timedelta(days=expires_in_days)

        user = request.user if request.user.is_authenticated else None

        if custom_slug:
            url_obj = URL.objects.create(
                short_code=custom_slug,
                original_url=original_url,
                expires_at=expires_at,
                created_by=user,
            )
        else:
            # Auto-increment Base62: create with temporary placeholder, then encode
            url_obj = URL.objects.create(
                short_code="tmp",
                original_url=original_url,
                expires_at=expires_at,
                created_by=user,
            )
            # Offset sequence at 100,000,000 to guarantee 5-6 char Base62 code
            calculated_code = encode_base62(SEQUENCE_OFFSET + url_obj.id)
            url_obj.short_code = calculated_code
            url_obj.save(update_fields=["short_code"])

        # Warm up Redis Cache-Aside
        if redis_client:
            try:
                cache_payload = json.dumps({
                    "original_url": url_obj.original_url,
                    "is_active": url_obj.is_active,
                    "expires_at": url_obj.expires_at.isoformat() if url_obj.expires_at else None,
                })
                redis_client.set(f"url:{url_obj.short_code}", cache_payload, ex=CACHE_TTL)
            except Exception:
                pass

        out_serializer = URLResponseSerializer(url_obj, context={"request": request})
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)


class RedirectView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, code: str):
        target_url = None
        is_active = True
        is_expired = False

        # 1. Check Redis Cache
        if redis_client:
            try:
                cached_data = redis_client.get(f"url:{code}")
                if cached_data:
                    parsed = json.loads(cached_data)
                    target_url = parsed.get("original_url")
                    is_active = parsed.get("is_active", True)
                    exp_str = parsed.get("expires_at")
                    if exp_str:
                        exp_dt = timezone.datetime.fromisoformat(exp_str)
                        if exp_dt < timezone.now():
                            is_expired = True
            except Exception:
                pass

        # 2. Cache Miss: Query Database
        if not target_url:
            url_obj = URL.objects.filter(short_code=code).first()
            if not url_obj:
                return JsonResponse({"error": "Not Found", "message": f'Short URL "{code}" not found.'}, status=404)

            target_url = url_obj.original_url
            is_active = url_obj.is_active
            is_expired = url_obj.is_expired

            # Store in Redis
            if redis_client and is_active and not is_expired:
                try:
                    cache_payload = json.dumps({
                        "original_url": target_url,
                        "is_active": is_active,
                        "expires_at": url_obj.expires_at.isoformat() if url_obj.expires_at else None,
                    })
                    redis_client.set(f"url:{code}", cache_payload, ex=CACHE_TTL)
                except Exception:
                    pass

        if not is_active:
            return JsonResponse({"error": "Deactivated", "message": "This shortened link has been deactivated."}, status=410)

        if is_expired:
            return JsonResponse({"error": "Expired", "message": "This shortened link has expired."}, status=410)

        # 3. Queue Click Event asynchronously
        click_payload = {
            "short_code": code,
            "clicked_at": timezone.now().isoformat(),
            "referrer": request.META.get("HTTP_REFERER", ""),
            "user_agent": request.META.get("HTTP_USER_AGENT", ""),
            "ip": get_client_ip(request),
        }

        if redis_client:
            try:
                redis_client.lpush("click_events", json.dumps(click_payload))
            except Exception:
                # If Redis queue is down, directly persist to DB
                LinkClick.objects.create(
                    short_code=code,
                    referrer=click_payload["referrer"] or None,
                    user_agent=click_payload["user_agent"] or None,
                )
        else:
            LinkClick.objects.create(
                short_code=code,
                referrer=click_payload["referrer"] or None,
                user_agent=click_payload["user_agent"] or None,
            )

        return HttpResponseRedirect(target_url, status=302)


class StatsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, code: str):
        url_obj = URL.objects.filter(short_code=code).first()
        if not url_obj:
            return Response(
                {"error": "Not Found", "message": f'No shortened URL found matching code "{code}"'},
                status=status.HTTP_404_NOT_FOUND,
            )

        clicks_qs = LinkClick.objects.filter(short_code=code)
        total_clicks = clicks_qs.count()

        # Top referrers
        top_referrers_qs = (
            clicks_qs.values("referrer")
            .annotate(count=Count("id"))
            .order_by("-count")[:10]
        )
        top_referrers = [
            {"referrer": r["referrer"] if r["referrer"] else "Direct / None", "count": r["count"]}
            for r in top_referrers_qs
        ]

        # Country breakdown
        country_qs = (
            clicks_qs.values("country_code")
            .annotate(count=Count("id"))
            .order_by("-count")[:15]
        )
        country_breakdown = [
            {"country_code": c["country_code"] if c["country_code"] else "Unknown", "count": c["count"]}
            for c in country_qs
        ]

        # Clicks over time (last 14 days)
        fourteen_days_ago = timezone.now() - timedelta(days=14)
        time_qs = (
            clicks_qs.filter(clicked_at__gte=fourteen_days_ago)
            .annotate(date=TruncDate("clicked_at"))
            .values("date")
            .annotate(count=Count("id"))
            .order_by("date")
        )
        clicks_over_time = [
            {"date": t["date"].strftime("%Y-%m-%d"), "count": t["count"]}
            for t in time_qs
        ]

        # Recent 15 clicks
        recent_clicks_qs = clicks_qs.order_by("-clicked_at")[:15]
        recent_clicks = [
            {
                "clicked_at": c.clicked_at.isoformat(),
                "referrer": c.referrer,
                "country_code": c.country_code,
                "user_agent": c.user_agent,
            }
            for c in recent_clicks_qs
        ]

        return Response({
            "short_code": url_obj.short_code,
            "original_url": url_obj.original_url,
            "created_at": url_obj.created_at.isoformat(),
            "expires_at": url_obj.expires_at.isoformat() if url_obj.expires_at else None,
            "is_active": url_obj.is_active,
            "total_clicks": total_clicks,
            "top_referrers": top_referrers,
            "country_breakdown": country_breakdown,
            "clicks_over_time": clicks_over_time,
            "recent_clicks": recent_clicks,
        })


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserMeSerializer(request.user)
        return Response(serializer.data)


class AdminURLListView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        urls_qs = URL.objects.all().order_by("-created_at")
        if query:
            urls_qs = urls_qs.filter(short_code__icontains=query) | urls_qs.filter(original_url__icontains=query)

        data = []
        for u in urls_qs[:100]:
            click_count = LinkClick.objects.filter(short_code=u.short_code).count()
            data.append({
                "id": u.id,
                "short_code": u.short_code,
                "original_url": u.original_url,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat(),
                "expires_at": u.expires_at.isoformat() if u.expires_at else None,
                "created_by": u.created_by.username if u.created_by else None,
                "total_clicks": click_count,
            })
        return Response({"count": len(data), "results": data})


class AdminURLToggleView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, pk: int):
        url_obj = URL.objects.filter(pk=pk).first()
        if not url_obj:
            return Response({"error": "Not Found"}, status=404)

        url_obj.is_active = not url_obj.is_active
        url_obj.save(update_fields=["is_active"])

        # Invalidate Redis cache
        if redis_client:
            try:
                redis_client.delete(f"url:{url_obj.short_code}")
            except Exception:
                pass

        return Response({
            "id": url_obj.id,
            "short_code": url_obj.short_code,
            "is_active": url_obj.is_active,
            "message": f"URL {url_obj.short_code} is now {'active' if url_obj.is_active else 'deactivated'}."
        })


class AdminURLDeleteView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def delete(self, request, pk: int):
        url_obj = URL.objects.filter(pk=pk).first()
        if not url_obj:
            return Response({"error": "Not Found"}, status=404)

        code = url_obj.short_code
        url_obj.delete()

        # Invalidate Redis cache
        if redis_client:
            try:
                redis_client.delete(f"url:{code}")
            except Exception:
                pass

        return Response({"message": f'URL "{code}" deleted successfully.'})
