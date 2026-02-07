"""
印记 - Redis 连接管理
"""

from typing import Optional

import redis.asyncio as aioredis

from app.config import get_settings

settings = get_settings()

# 全局 Redis 连接池
redis_client: Optional[aioredis.Redis] = None


async def init_redis():
    """初始化 Redis 连接"""
    global redis_client
    redis_client = aioredis.from_url(
        settings.redis_url,
        encoding="utf-8",
        decode_responses=True,
        max_connections=50,
    )
    # 测试连接
    await redis_client.ping()


async def close_redis():
    """关闭 Redis 连接"""
    global redis_client
    if redis_client:
        await redis_client.close()
        redis_client = None


def get_redis() -> aioredis.Redis:
    """获取 Redis 客户端（依赖注入）"""
    if redis_client is None:
        raise RuntimeError("Redis 未初始化，请先调用 init_redis()")
    return redis_client
