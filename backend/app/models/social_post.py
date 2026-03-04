"""
印记 - 朋友圈文案模型
"""

from datetime import datetime, timezone

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.types import get_json_type, get_pk_type

CompatJSON = get_json_type()
PKType = get_pk_type()


class SocialPost(Base):
    __tablename__ = "social_posts"

    id: Mapped[int] = mapped_column(PKType, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(PKType, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    diary_id: Mapped[int | None] = mapped_column(PKType, ForeignKey("diaries.id", ondelete="SET NULL"), nullable=True)

    generated_content: Mapped[str] = mapped_column(Text, nullable=False)
    final_content: Mapped[str | None] = mapped_column(Text, nullable=True, comment="用户修改后的内容")
    style_tag: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="风格标签")
    is_used: Mapped[bool] = mapped_column(Boolean, default=False)
    user_modifications: Mapped[dict | None] = mapped_column(CompatJSON, nullable=True, comment="用户修改记录")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # 关系
    diary: Mapped["Diary"] = relationship(back_populates="social_posts")  # noqa: F821
