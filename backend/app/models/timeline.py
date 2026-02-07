"""
印记 - 时间轴事件模型
"""

from datetime import date, datetime, timezone

from sqlalchemy import BigInteger, Date, DateTime, ForeignKey, SmallInteger, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    diary_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("diaries.id", ondelete="SET NULL"), nullable=True)

    event_date: Mapped[date] = mapped_column(Date, nullable=False)
    event_summary: Mapped[str] = mapped_column(String(500), nullable=False)
    emotion_tag: Mapped[str | None] = mapped_column(String(50), nullable=True)
    importance_score: Mapped[int] = mapped_column(SmallInteger, default=5, comment="重要性评分1-10")
    event_type: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="work/relationship/health/achievement")
    related_entities: Mapped[dict | None] = mapped_column(JSONB, nullable=True, comment="相关实体（人物/地点）")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # 关系
    diary: Mapped["Diary"] = relationship(back_populates="timeline_events")  # noqa: F821
