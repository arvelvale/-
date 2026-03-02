"""
印记 - 认证路由
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.auth import LoginRequest, RefreshTokenRequest, RegisterRequest
from app.schemas.common import success_response
from app.services.auth_service import AuthService
from app.utils.email_service import send_verification_code, verify_code

router = APIRouter()


# ── 验证码相关 Schema ──────────────────────────────────────────
class SendCodeRequest(BaseModel):
    email: EmailStr


class EmailCodeLoginRequest(BaseModel):
    email: EmailStr
    code: str
    username: str = ""   # 注册时需要填写，登录时可为空


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


@router.post("/send-code", summary="发送邮箱验证码")
async def send_code(req: SendCodeRequest):
    """
    向指定邮箱发送6位数字验证码，有效期5分钟。
    同一邮箱60秒内只能发送一次（前端控制倒计时）。
    """
    try:
        await send_verification_code(req.email)
        return success_response({"message": "验证码已发送"})
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"邮件发送失败: {str(e)}"
        )


@router.post("/email-login", summary="邮箱验证码登录/注册")
async def email_code_login(req: EmailCodeLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    验证邮箱验证码，自动完成注册（首次）或登录（已有账号）。
    - 验证码正确 → 查找或创建用户 → 返回token
    """
    if not verify_code(req.email, req.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码错误或已过期"
        )
    try:
        service = AuthService(db)
        data = await service.login_or_register_by_email(
            email=req.email,
            username=req.username or req.email.split("@")[0],
        )
        return success_response(data)
    except Exception as e:
        import traceback
        import logging
        logging.getLogger(__name__).error(
            f"Email login failed: {type(e).__name__}: {e}\n{traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
