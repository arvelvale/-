"""
印记 - 日记模型
"""

from datetime import date, datetime, timezone

from sqlalchemy import BigInteger, Boolean, Date, DateTime, ForeignKey, Integer, SmallInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.types import get_json_type

CompatJSON = get_json_type()


class Diary(Base):
    __tablename__ = "diaries"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_html: Mapped[str | None] = mapped_column(Text, nullable=True, comment="富文本HTML")
    diary_date: Mapped[date] = mapped_column(Date, nullable=False)

    emotion_tags: Mapped[dict | None] = mapped_column(CompatJSON, nullable=True, comment="情绪标签数组")
    importance_score: Mapped[int] = mapped_column(SmallInteger, default=5, comment="重要性评分1-10")
    word_count: Mapped[int] = mapped_column(Integer, default=0)
    images: Mapped[dict | None] = mapped_column(CompatJSON, nullable=True, comment="图片URL数组")
    is_analyzed: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # 关系
    user: Mapped["User"] = relationship(back_populates="diaries")  # noqa: F821
    analyses: Mapped[list["AIAnalysis"]] = relationship(back_populates="diary", cascade="all, delete-orphan")  # noqa: F821
    timeline_events: Mapped[list["TimelineEvent"]] = relationship(back_populates="diary")  # noqa: F821
    social_posts: Mapped[list["SocialPost"]] = relationship(back_populates="diary")  # noqa: F821

    # 索引 (通过 __table_args__)
    __table_args__ = (
        # 联合索引: 用户 + 日期
        # Index("idx_diaries_user_date", "user_id", "diary_date"),
    )
