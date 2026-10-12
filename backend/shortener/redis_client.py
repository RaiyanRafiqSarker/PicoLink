import logging
from django.conf import settings
import redis

logger = logging.getLogger(__name__)

class RedisManager:
    _instance = None
    _client = None

    @classmethod
    def get_client(cls):
        if cls._client is None:
            try:
                cls._client = redis.Redis(
                    host=settings.REDIS_HOST,
                    port=settings.REDIS_PORT,
                    password=settings.REDIS_PASSWORD,
                    decode_responses=True,
                    socket_connect_timeout=2,
                    socket_timeout=2,
                )
                cls._client.ping()
                logger.info("[Redis] Connected to Redis successfully.")
            except Exception as e:
                logger.warning(f"[Redis] Could not connect to Redis: {e}. Fallback to direct DB mode.")
                cls._client = None
        return cls._client

redis_client = RedisManager.get_client()
