import os
import sys
import json
import time
import signal
import logging
from datetime import datetime

# Initialize Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
import django
django.setup()

from django.conf import settings
from django.utils import timezone
from shortener.models import LinkClick
from shortener.redis_client import redis_client
from shortener.utils.bots import is_bot_user_agent

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ClickWorker")

BATCH_SIZE = int(os.environ.get("WORKER_BATCH_SIZE", "50"))
FLUSH_INTERVAL_SECONDS = 2.0

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
        for item in self.buffer:
            user_agent = item.get("user_agent") or None
            # Keep bot hits for auditing, but flag them so dashboards only count real visitors
            is_bot = is_bot_user_agent(user_agent)
            bot_count += is_bot

            # Parse clicked_at
            clicked_at = timezone.now()
            if "clicked_at" in item:
                try:
                    clicked_at = datetime.fromisoformat(item["clicked_at"])
                except Exception:
                    pass

            records_to_insert.append(
                LinkClick(
                    short_code=item.get("short_code", ""),
                    clicked_at=clicked_at,
                    referrer=item.get("referrer") or None,
                    user_agent=user_agent,
                    country_code=item.get("country_code") or None,
                    is_bot=is_bot,
                )
            )

        try:
            LinkClick.objects.bulk_create(records_to_insert, batch_size=100)
            logger.info(
                f"Successfully bulk-inserted {count} click records into PostgreSQL "
                f"({bot_count} flagged as bots)."
            )
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
                # Pop up to BATCH_SIZE items from Redis list
                raw = redis_client.rpop("click_events")
                if raw:
                    try:
                        event = json.loads(raw)
                        self.buffer.append(event)
                    except json.JSONDecodeError:
                        logger.warning(f"Malformed event JSON discarded: {raw}")

                # Flush condition: reached BATCH_SIZE or flush interval exceeded
                time_since_flush = time.time() - self.last_flush
                if len(self.buffer) >= BATCH_SIZE or (self.buffer and time_since_flush >= FLUSH_INTERVAL_SECONDS):
                    self.flush()

                # If no item was popped, sleep briefly to avoid busy loop
                if not raw:
                    time.sleep(0.2)

            except Exception as e:
                logger.error(f"Worker iteration error: {e}")
                time.sleep(1.0)

        # Final flush on exit
        logger.info("Worker shutting down. Flushing remaining buffer...")
        self.flush()
        logger.info("Worker shutdown complete.")

if __name__ == "__main__":
    worker = ClickConsumerWorker()
    worker.run()
