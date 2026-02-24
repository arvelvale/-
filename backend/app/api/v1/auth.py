"""
印记 - 认证路由
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.auth import LoginRequest, RefreshTokenRequest, RegisterRequest
from app.schemas.common import success_response
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/register", summary="用户注册")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    用户注册

    - **username**: 用户名（2-50字符）
    - **email**: 邮箱
    - **password**: 密码（6-128字符）
    """
    try:
        service = AuthService(db)
        data = await service.register(
            username=req.username,
            email=req.email,
            password=req.password,
        )
        return success_response(data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", summary="用户登录")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    用户登录

    - **email**: 邮箱
    - **password**: 密码
    """
    try:
        service = AuthService(db)
        data = await service.login(email=req.email, password=req.password)
        return success_response(data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/refresh", summary="刷新Token")
async def refresh_token(req: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    """
    使用refreshToken获取新的accessToken
    """
    try:
        service = AuthService(db)
        data = await service.refresh_token(req.refresh_token)
        return success_response(data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
