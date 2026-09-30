import redis
from app.config import settings

# Initialize Redis client with fallback to host 'redis' (Docker service name)
redis_client = redis.Redis(
    host=getattr(settings, "REDIS_HOST", "redis"),
    port=getattr(settings, "REDIS_PORT", 6379),
    db=0,
    decode_responses=True,  # Automatically decodes UTF-8 string responses
)


def get_redis():
  """Dependency provider for FastAPI routes or services."""
  return redis_client