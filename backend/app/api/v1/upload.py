"""
印记 - 文件上传路由
"""

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user_id
from app.schemas.common import success_response

router = APIRouter()


@router.post("/image", summary="上传图片")
async def upload_image(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """上传图片并返回URL"""
    # TODO: 实现图片上传逻辑
    # 1. 验证文件类型（只允许图片）
    # 2. 验证文件大小（限制5MB）
    # 3. 生成唯一文件名
    # 4. 保存到本地或云存储
    # 5. 返回图片URL
    return success_response({
        "message": "图片上传功能开发中",
        "url": "",
    })
