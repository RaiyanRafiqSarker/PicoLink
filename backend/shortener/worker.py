import os
import sys
import json
import time
import signal
import logging
import hmac
import hashlib
import urllib.request
import threading
from datetime import datetime

# Initialize Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
import django
django.setup()

from django.conf import settings
from django.utils import timezone
from shortener.models import LinkClick, URL, ClickWebhook
from shortener.redis_client import redis_client
from shortener.utils.bots import is_bot_user_agent

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ClickWorker")

BATCH_SIZE = int(os.environ.get("WORKER_BATCH_SIZE", "50"))
FLUSH_INTERVAL_SECONDS = 2.0


def dispatch_webhooks_for_clicks(human_clicks):
    """Dispatch outgoing click webhooks asynchronously with HMAC-SHA256 signature."""
    if not human_clicks:
        return

    def _deliver():
        try:
            # Group clicks by short_code
            codes = list(set([c.short_code for c in human_clicks]))
            urls = URL.objects.filter(short_code__in=codes).select_related("created_by")
            user_by_code = {u.short_code: u.created_by for u in urls if u.created_by}

            # Collect active webhooks per user
            users = set(user_by_code.values())
            if not users:
                return

            webhooks = ClickWebhook.objects.filter(user__in=users, is_active=True)
            webhooks_by_user = {}
            for wh in webhooks:
                webhooks_by_user.setdefault(wh.user_id, []).append(wh)

            for click in human_clicks:
                user = user_by_code.get(click.short_code)
                if not user:
                    continue
                user_whs = webhooks_by_user.get(user.id, [])
                for wh in user_whs:
                    payload = {
                        "event": "click.created",
                        "short_code": click.short_code,
                        "clicked_at": click.clicked_at.isoformat(),
                        "referrer": click.referrer,
                        "country_code": click.country_code,
                    }
                    raw_body = json.dumps(payload).encode("utf-8")
                    signature = hmac.new(wh.secret_key.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()

                    req = urllib.request.Request(
                        wh.target_url,
                        data=raw_body,
                        headers={
                            "Content-Type": "application/json",
                            "User-Agent": "PicoLink-Webhook/1.0",
                            "X-PicoLink-Signature": f"sha256={signature}",
                        },
                        method="POST",
                    )
                    try:
                        with urllib.request.urlopen(req, timeout=3) as resp:
                            pass
                    except Exception as err:
                        logger.warning(f"Webhook dispatch error to {wh.target_url}: {err}")
        except Exception as e:
            logger.error(f"Error in webhook delivery thread: {e}")

    threading.Thread(target=_deliver, daemon=True).start()


class ClickConsumerWorker:
    def __init__(self):
        self.running = True
        self.buffer = []
        self.last_flush = time.time()
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

    def _signal_handler(self, sig, frame):
        logger.info(f"Received termination signal ({sig}). Commencing graceful shutdown...")
        self.running = False

    def flush(self):
        if not self.buffer:
            return

        count = len(self.buffer)
        bot_count = 0
        records_to_insert = []
        human_records = []

        for item in self.buffer:
            user_agent = item.get("user_agent") or None
            is_bot = is_bot_user_agent(user_agent)
            bot_count += is_bot

            clicked_at = timezone.now()
            if "clicked_at" in item:
                try:
                    clicked_at = datetime.fromisoformat(item["clicked_at"])
                except Exception:
                    pass

            click_obj = LinkClick(
                short_code=item.get("short_code", ""),
                clicked_at=clicked_at,
                referrer=item.get("referrer") or None,
                user_agent=user_agent,
                country_code=item.get("country_code") or None,
                is_bot=is_bot,
            )
            records_to_insert.append(click_obj)
            if not is_bot:
                human_records.append(click_obj)

        try:
            LinkClick.objects.bulk_create(records_to_insert, batch_size=100)
            logger.info(
                f"Successfully bulk-inserted {count} click records into PostgreSQL "
                f"({bot_count} flagged as bots)."
            )
            # Dispatch webhooks for human clicks (Phase 5.2)
            if human_records:
                dispatch_webhooks_for_clicks(human_records)

        except Exception as e:
            logger.error(f"Failed to bulk-insert click batch: {e}")
        finally:
            self.buffer.clear()
            self.last_flush = time.time()

    def run(self):
        logger.info(f"Click Consumer Worker started. Consuming from Redis queue 'click_events' (batch={BATCH_SIZE})...")

        if not redis_client:
            logger.error("Redis client is not available. Worker cannot consume from Redis.")
            return

        while self.running:
            try:
                raw = redis_client.rpop("click_events")
                if raw:
                    try:
                        event = json.loads(raw)
                        self.buffer.append(event)
                    except json.JSONDecodeError:
                        logger.warning(f"Malformed event JSON discarded: {raw}")

                time_since_flush = time.time() - self.last_flush
                if len(self.buffer) >= BATCH_SIZE or (self.buffer and time_since_flush >= FLUSH_INTERVAL_SECONDS):
                    self.flush()

                if not raw:
                    time.sleep(0.2)

            except Exception as e:
                logger.error(f"Worker iteration error: {e}")
                time.sleep(1.0)

        logger.info("Worker shutting down. Flushing remaining buffer...")
        self.flush()
        logger.info("Worker shutdown complete.")

if __name__ == "__main__":
    worker = ClickConsumerWorker()
    worker.run()
