"""
印记 - 应用配置管理
使用 pydantic-settings 加载环境变量
"""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """全局配置"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # 应用基础配置
    app_name: str = "印记"
    app_version: str = "0.1.0"
    app_env: str = "development"
    debug: bool = True
    secret_key: str = "dev-secret-key-change-in-production"
    api_prefix: str = "/v1"

    # 服务端口
    host: str = "0.0.0.0"
    port: int = 8000

    # JWT 配置
    jwt_secret_key: str = "dev-jwt-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 10080  # 7天
    jwt_refresh_token_expire_days: int = 30

    # PostgreSQL
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_user: str = "yinji"
    postgres_password: str = "yinji_password"
    postgres_db: str = "yinji_db"

    # 开发模式：无Docker时自动使用SQLite
    use_sqlite: bool = False

    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: str = ""
    redis_db: int = 0

    # Milvus
    milvus_host: str = "localhost"
    milvus_port: int = 19530

    # Neo4j
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "neo4j_password"

    # RabbitMQ
    rabbitmq_host: str = "localhost"
    rabbitmq_port: int = 5672
    rabbitmq_user: str = "guest"
    rabbitmq_password: str = "guest"

    # LLM
    llm_api_key: str = ""
    llm_base_url: str = "https://api.deepseek.com/v1"
    llm_model: str = "deepseek-chat"

    # 对象存储
    oss_access_key_id: str = ""
    oss_access_key_secret: str = ""
    oss_bucket_name: str = "yinji-assets"
    oss_endpoint: str = ""
    oss_region: str = "cn-hangzhou"

    # 限流
    rate_limit_free: int = 100
    rate_limit_premium: int = 1000

    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # ---------- 派生属性 ----------

    @property
    def database_url(self) -> str:
        """数据库异步连接字符串"""
        if self.use_sqlite:
            return "sqlite+aiosqlite:///./yinji_dev.db"
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def database_url_sync(self) -> str:
        """数据库同步连接字符串（Alembic迁移用）"""
        if self.use_sqlite:
            return "sqlite:///./yinji_dev.db"
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def redis_url(self) -> str:
        """Redis 连接字符串"""
        if self.redis_password:
            return f"redis://:{self.redis_password}@{self.redis_host}:{self.redis_port}/{self.redis_db}"
        return f"redis://{self.redis_host}:{self.redis_port}/{self.redis_db}"

    @property
    def rabbitmq_url(self) -> str:
        """RabbitMQ 连接字符串"""
        return (
            f"amqp://{self.rabbitmq_user}:{self.rabbitmq_password}"
            f"@{self.rabbitmq_host}:{self.rabbitmq_port}/"
        )

    @property
    def cors_origins_list(self) -> List[str]:
        """CORS允许的来源列表"""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache()
def get_settings() -> Settings:
    """获取全局配置单例"""
    return Settings()
