"""
印记 - 日记路由
"""

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user_id
from app.schemas.common import success_response
from app.schemas.diary import CreateDiaryRequest, UpdateDiaryRequest
from app.services.diary_service import DiaryService

router = APIRouter()


@router.post("", summary="创建日记")
async def create_diary(
    req: CreateDiaryRequest,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """创建一篇新日记"""
    service = DiaryService(db)
    data = await service.create_diary(
        user_id=user_id,
        content=req.content,
        diary_date=req.diary_date,
        title=req.title,
        emotion_tags=req.emotion_tags,
        importance_score=req.importance_score or 5,
        images=req.images,
    )
    return success_response(data)


@router.get("", summary="获取日记列表")
async def get_diary_list(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, alias="pageSize", description="每页数量"),
    start_date: Optional[date] = Query(None, alias="startDate", description="开始日期"),
    end_date: Optional[date] = Query(None, alias="endDate", description="结束日期"),
    emotion_tag: Optional[str] = Query(None, alias="emotionTag", description="情绪标签筛选"),
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """获取当前用户的日记列表（分页）"""
    service = DiaryService(db)
    data = await service.get_diary_list(
        user_id=user_id,
        page=page,
        page_size=page_size,
        start_date=start_date,
        end_date=end_date,
        emotion_tag=emotion_tag,
    )
    return success_response(data)


@router.get("/{diary_id}", summary="获取日记详情")
async def get_diary_detail(
    diary_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """获取指定日记的详细内容"""
    service = DiaryService(db)
    data = await service.get_diary_detail(user_id=user_id, diary_id=diary_id)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="日记不存在")
    return success_response(data)


@router.put("/{diary_id}", summary="更新日记")
async def update_diary(
    diary_id: int,
    req: UpdateDiaryRequest,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """更新指定日记"""
    service = DiaryService(db)
    update_data = req.model_dump(exclude_unset=True, by_alias=False)
    data = await service.update_diary(user_id=user_id, diary_id=diary_id, **update_data)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="日记不存在")
    return success_response(data)


@router.delete("/{diary_id}", summary="删除日记")
async def delete_diary(
    diary_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """删除指定日记"""
    service = DiaryService(db)
    deleted = await service.delete_diary(user_id=user_id, diary_id=diary_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="日记不存在")
    return success_response({"message": "日记删除成功"})
