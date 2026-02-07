"""
印记 - 认证相关Schema
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ---------- 请求 ----------

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50, description="用户名")
    email: EmailStr = Field(..., description="邮箱")
    password: str = Field(..., min_length=6, max_length=128, description="密码")
    invite_code: Optional[str] = Field(None, alias="inviteCode", description="邀请码")


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="邮箱")
    password: str = Field(..., description="密码")


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., alias="refreshToken", description="刷新Token")

    model_config = {"populate_by_name": True}


# ---------- 响应 ----------

class TokenResponse(BaseModel):
    user_id: int = Field(alias="userId")
    username: str
    email: Optional[str] = None
    token: str
    refresh_token: str = Field(alias="refreshToken")
    expires_at: str = Field(alias="expiresAt")

    model_config = {"populate_by_name": True}


class RefreshResponse(BaseModel):
    token: str
    expires_at: str = Field(alias="expiresAt")

    model_config = {"populate_by_name": True}
