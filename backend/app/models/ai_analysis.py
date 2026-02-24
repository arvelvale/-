"""
印记 - AI分析记录模型
"""

from datetime import datetime, timezone

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.types import get_json_type

CompatJSON = get_json_type()


class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    diary_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("diaries.id", ondelete="CASCADE"), nullable=False)

    analysis_type: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="satir/emotion/summary")

    # 萨提亚冰山五层
    behavior_layer: Mapped[dict | None] = mapped_column(CompatJSON, nullable=True, comment="行为层分析")
    emotion_layer: Mapped[dict | None] = mapped_column(CompatJSON, nullable=True, comment="情绪层分析")
    cognitive_layer: Mapped[dict | None] = mapped_column(CompatJSON, nullable=True, comment="思维层分析")
    belief_layer: Mapped[dict | None] = mapped_column(CompatJSON, nullable=True, comment="信念层分析")
    core_self_layer: Mapped[dict | None] = mapped_column(CompatJSON, nullable=True, comment="存在层分析")

    response_text: Mapped[str | None] = mapped_column(Text, nullable=True, comment="AI回复文本")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # 关系
    diary: Mapped["Diary"] = relationship(back_populates="analyses")  # noqa: F821
