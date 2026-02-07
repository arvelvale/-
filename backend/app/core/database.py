"""
印记 - PostgreSQL 数据库连接管理
使用 SQLAlchemy 2.0 异步引擎
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()

# 异步引擎
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=3600,
)

# 异步Session工厂
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """SQLAlchemy ORM 基类"""
    pass


async def init_db():
    """初始化数据库连接（启动时调用）"""
    # 在开发环境，自动创建表（生产环境应使用Alembic迁移）
    if settings.debug:
        async with engine.begin() as conn:
            # 导入所有模型，确保它们被注册
            from app.models import user, diary, timeline, ai_analysis, social_post  # noqa: F401
            await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """关闭数据库连接（关闭时调用）"""
    await engine.dispose()


async def get_db() -> AsyncSession:
    """获取数据库Session（依赖注入）"""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
