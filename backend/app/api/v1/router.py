"""
印记 - API v1 总路由
"""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.diaries import router as diaries_router
from app.api.v1.users import router as users_router
from app.api.v1.analyses import router as analyses_router
from app.api.v1.social import router as social_router
from app.api.v1.stats import router as stats_router
from app.api.v1.upload import router as upload_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["认证"])
api_router.include_router(users_router, prefix="/users", tags=["用户"])
api_router.include_router(diaries_router, prefix="/diaries", tags=["日记"])
api_router.include_router(analyses_router, prefix="/analyses", tags=["AI分析"])
api_router.include_router(social_router, prefix="/social", tags=["朋友圈文案"])
api_router.include_router(stats_router, prefix="/stats", tags=["统计数据"])
api_router.include_router(upload_router, prefix="/upload", tags=["文件上传"])
