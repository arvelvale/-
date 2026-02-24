"""
印记 - 用户模型
"""

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String, BigInteger, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.types import get_json_type

CompatJSON = get_json_type()


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(255), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False)
    premium_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # 关系
    profile: Mapped["UserProfile"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    diaries: Mapped[list["Diary"]] = relationship(back_populates="user", cascade="all, delete-orphan")  # noqa: F821


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    identity_tag: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="身份标签: 创业者/职场精英/文艺青年等")
    current_state: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="当前状态: 迷茫/压力大/记录美好等")
    personality_type: Mapped[str | None] = mapped_column(String(20), nullable=True, comment="MBTI类型")
    social_style: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="朋友圈风格")
    catchphrases: Mapped[dict | None] = mapped_column(CompatJSON, nullable=True, comment="口头禅列表")
    preferences: Mapped[dict | None] = mapped_column(CompatJSON, nullable=True, comment="偏好数据")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # 关系
    user: Mapped["User"] = relationship(back_populates="profile")
