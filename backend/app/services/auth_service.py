"""
印记 - 认证服务
"""

from datetime import datetime, timezone

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserProfile
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)


class AuthService:
    """认证服务"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, username: str, email: str, password: str) -> dict:
        """用户注册"""
        # 检查用户名是否已存在
        result = await self.db.execute(select(User).where(User.username == username))
        if result.scalar_one_or_none():
            raise ValueError("用户名已被注册")

        # 检查邮箱是否已存在
        result = await self.db.execute(select(User).where(User.email == email))
        if result.scalar_one_or_none():
            raise ValueError("邮箱已被注册")

        # 创建用户
        user = User(
            username=username,
            email=email,
            password_hash=hash_password(password),
        )
        self.db.add(user)
        await self.db.flush()  # 获取自增ID

        # 创建空画像
        profile = UserProfile(user_id=user.id)
        self.db.add(profile)

        await self.db.commit()
        await self.db.refresh(user)

        # 生成Token
        access_token, expires_at = create_access_token(user.id, user.username)
        refresh_token = create_refresh_token(user.id)

        logger.info(f"新用户注册: id={user.id}, username={username}")

        return {
            "userId": user.id,
            "username": user.username,
            "email": user.email,
            "token": access_token,
            "refreshToken": refresh_token,
            "expiresAt": expires_at.isoformat(),
        }

    async def login(self, email: str, password: str) -> dict:
        """用户登录"""
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user or not verify_password(password, user.password_hash):
            raise ValueError("邮箱或密码错误")

        if not user.is_active:
            raise ValueError("账号已被禁用")

        # 更新最后登录时间
        user.last_login_at = datetime.now(timezone.utc)
        await self.db.commit()

        # 生成Token
        access_token, expires_at = create_access_token(user.id, user.username)
        refresh_token = create_refresh_token(user.id)

        logger.info(f"用户登录: id={user.id}, username={user.username}")

        return {
            "userId": user.id,
            "username": user.username,
            "token": access_token,
            "refreshToken": refresh_token,
            "expiresAt": expires_at.isoformat(),
        }

    async def login_or_register_by_email(self, email: str, username: str) -> dict:
        """邮箱验证码登录/注册：已有账号直接登录，否则自动注册"""
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user:
            # 自动注册：生成随机密码（用户不需要记，后续可通过验证码登录）
            import secrets
            random_pw = secrets.token_hex(16)
            # 确保用户名不重复
            base_username = username
            suffix = 0
            while True:
                uname = base_username if suffix == 0 else f"{base_username}{suffix}"
                res2 = await self.db.execute(select(User).where(User.username == uname))
                if not res2.scalar_one_or_none():
                    break
                suffix += 1
            user = User(
                username=uname,
                email=email,
                password_hash=hash_password(random_pw),
            )
            self.db.add(user)
            await self.db.flush()
            profile = UserProfile(user_id=user.id)
            self.db.add(profile)
            await self.db.commit()
            await self.db.refresh(user)
            logger.info(f"验证码自动注册: id={user.id}, email={email}")
        else:
            if not user.is_active:
                raise ValueError("账号已被禁用")
            user.last_login_at = datetime.now(timezone.utc)
            await self.db.commit()
            logger.info(f"验证码登录: id={user.id}, email={email}")

        access_token, expires_at = create_access_token(user.id, user.username)
        refresh_token = create_refresh_token(user.id)

        return {
            "userId": user.id,
            "username": user.username,
            "email": user.email,
            "token": access_token,
            "refreshToken": refresh_token,
            "expiresAt": expires_at.isoformat(),
        }

    async def refresh_token(self, refresh_token_str: str) -> dict:
        """刷新Token"""
        payload = decode_token(refresh_token_str)

        if payload is None or payload.get("type") != "refresh":
            raise ValueError("刷新Token无效或已过期")

        user_id = int(payload["sub"])

        # 查询用户
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user or not user.is_active:
            raise ValueError("用户不存在或已被禁用")

        # 生成新的访问Token
        access_token, expires_at = create_access_token(user.id, user.username)

        return {
            "token": access_token,
            "expiresAt": expires_at.isoformat(),
        }
