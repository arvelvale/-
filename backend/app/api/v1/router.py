"""
印记 - API v1 总路由
"""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.diaries import router as diaries_router
from app.api.v1.users import router as users_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["认证"])
api_router.include_router(users_router, prefix="/users", tags=["用户"])
api_router.include_router(diaries_router, prefix="/diaries", tags=["日记"])
