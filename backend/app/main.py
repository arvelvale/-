"""
印记 - FastAPI 应用入口
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.core.database import close_db, init_db
from app.core.redis import close_redis, init_redis
from app.core.logger import setup_logger
from app.middleware.trace import TraceIdMiddleware
from app.middleware.error_handler import register_exception_handlers
from app.api.v1.router import api_router

settings = get_settings()
logger = setup_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # --- 启动 ---
    logger.info(f"🚀 {settings.app_name} v{settings.app_version} 正在启动...")
    logger.info(f"📍 环境: {settings.app_env}")

    try:
        await init_db()
        logger.info("✅ PostgreSQL 连接就绪")
    except Exception as e:
        logger.warning(f"⚠️ PostgreSQL 连接失败: {e}（应用仍可启动，但数据库功能不可用）")

    try:
        await init_redis()
        logger.info("✅ Redis 连接就绪")
    except Exception as e:
        logger.warning(f"⚠️ Redis 连接失败: {e}（应用仍可启动，但缓存功能不可用）")

    logger.info(f"🌐 服务运行在 http://{settings.host}:{settings.port}")

    yield

    # --- 关闭 ---
    logger.info("🛑 正在关闭服务...")
    await close_redis()
    await close_db()
    logger.info("👋 服务已关闭")


def create_app() -> FastAPI:
    """创建 FastAPI 应用实例"""
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="基于RAG知识库的智能日记应用，通过AI技术实现深度自我认知和情感陪伴",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        lifespan=lifespan,
    )

    # CORS中间件
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # TraceId追踪中间件
    app.add_middleware(TraceIdMiddleware)

    # 全局异常处理
    register_exception_handlers(app)

    # 注册API路由
    app.include_router(api_router, prefix=settings.api_prefix)

    # 健康检查
    @app.get("/health", tags=["系统"])
    async def health_check():
        return {
            "status": "healthy",
            "app": settings.app_name,
            "version": settings.app_version,
            "env": settings.app_env,
        }

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
