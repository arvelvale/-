"""
印记 - 朋友圈文案路由
"""

from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user_id
from app.schemas.common import success_response

router = APIRouter()


@router.post("/generate", summary="生成朋友圈文案")
async def generate_post(
    data: dict,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """基于日记内容生成朋友圈文案"""
    # TODO: 实现文案生成逻辑
    # 1. 获取日记内容或用户输入内容
    # 2. 调用AI服务生成文案
    # 3. 返回多个版本的文案
    diary_id = data.get("diaryId")
    content = data.get("content")
    style = data.get("style", "minimal")
    catchphrases = data.get("catchphrases", [])

    return success_response({
        "message": "文案生成功能开发中",
        "posts": [],
        "style": style,
    })


@router.post("", summary="保存朋友圈文案")
async def save_post(
    data: dict,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """保存用户选择的文案"""
    # TODO: 实现保存逻辑
    return success_response({
        "message": "保存成功",
    })


@router.get("", summary="获取文案列表")
async def get_post_list(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """获取用户的历史文案列表"""
    # TODO: 实现列表查询
    return success_response({
        "message": "文案列表功能开发中",
        "posts": [],
    })
