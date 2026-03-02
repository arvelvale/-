"""
印记 - 日记服务
"""

from datetime import date
from typing import Optional

from loguru import logger
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.diary import Diary


class DiaryService:
    """日记服务"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_diary(
        self,
        user_id: int,
        content: str,
        diary_date: date,
        title: Optional[str] = None,
        emotion_tags: Optional[list] = None,
        importance_score: int = 5,
        images: Optional[list] = None,
    ) -> dict:
        """创建日记"""
        diary = Diary(
            user_id=user_id,
            title=title,
            content=content,
            diary_date=diary_date,
            emotion_tags=emotion_tags,
            importance_score=importance_score,
            word_count=len(content),
            images=images,
        )
        self.db.add(diary)
        await self.db.flush()
        await self.db.refresh(diary)

        logger.info(f"日记创建: diary_id={diary.id}, user_id={user_id}")

        return {
            "diaryId": diary.id,
            "createdAt": diary.created_at.isoformat(),
            "message": "日记创建成功",
        }

    async def get_diary_list(
        self,
        user_id: int,
        page: int = 1,
        page_size: int = 20,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        emotion_tag: Optional[str] = None,
    ) -> dict:
        """获取日记列表"""
        query = select(Diary).where(Diary.user_id == user_id)

        if start_date:
            query = query.where(Diary.diary_date >= start_date)
        if end_date:
            query = query.where(Diary.diary_date <= end_date)

        # 总数
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # 分页
        query = query.order_by(Diary.diary_date.desc(), Diary.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(query)
        diaries = result.scalars().all()

        return {
            "total": total,
            "page": page,
            "pageSize": page_size,
            "diaries": [
                {
                    "diaryId": d.id,
                    "title": d.title,
                    "contentPreview": d.content[:100] + "..." if len(d.content) > 100 else d.content,
                    "diaryDate": d.diary_date.isoformat(),
                    "emotionTags": d.emotion_tags,
                    "importanceScore": d.importance_score,
                    "isAnalyzed": d.is_analyzed,
                    "createdAt": d.created_at.isoformat(),
                }
                for d in diaries
            ],
        }

    async def get_diary_detail(self, user_id: int, diary_id: int) -> Optional[dict]:
        """获取日记详情"""
        result = await self.db.execute(
            select(Diary).where(Diary.id == diary_id, Diary.user_id == user_id)
        )
        diary = result.scalar_one_or_none()

        if not diary:
            return None

        return {
            "diaryId": diary.id,
            "title": diary.title,
            "content": diary.content,
            "contentHtml": diary.content_html,
            "diaryDate": diary.diary_date.isoformat(),
            "emotionTags": diary.emotion_tags,
            "importanceScore": diary.importance_score,
            "wordCount": diary.word_count,
            "images": diary.images,
            "isAnalyzed": diary.is_analyzed,
            "createdAt": diary.created_at.isoformat(),
            "updatedAt": diary.updated_at.isoformat(),
        }

    async def update_diary(
        self,
        user_id: int,
        diary_id: int,
        **kwargs,
    ) -> Optional[dict]:
        """更新日记"""
        result = await self.db.execute(
            select(Diary).where(Diary.id == diary_id, Diary.user_id == user_id)
        )
        diary = result.scalar_one_or_none()

        if not diary:
            return None

        # 动态更新字段
        for key, value in kwargs.items():
            if value is not None and hasattr(diary, key):
                setattr(diary, key, value)

        if "content" in kwargs and kwargs["content"]:
            diary.word_count = len(kwargs["content"])

        await self.db.flush()
        await self.db.refresh(diary)

        logger.info(f"日记更新: diary_id={diary_id}, user_id={user_id}")

        return {"message": "日记更新成功"}

    async def delete_diary(self, user_id: int, diary_id: int) -> bool:
        """删除日记"""
        result = await self.db.execute(
            select(Diary).where(Diary.id == diary_id, Diary.user_id == user_id)
        )
        diary = result.scalar_one_or_none()

        if not diary:
            return False

        await self.db.delete(diary)
        await self.db.flush()

        logger.info(f"日记删除: diary_id={diary_id}, user_id={user_id}")
        return True
