"""
印记 - 用户路由
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_current_user_id
from app.models.user import User, UserProfile
from app.schemas.common import success_response
from app.schemas.user import UpdateProfileRequest

router = APIRouter()


@router.get("/{user_id}/profile", summary="获取用户画像")
async def get_user_profile(
    user_id: int,
    current_user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """获取指定用户的画像信息"""
    if user_id != current_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权访问其他用户画像")

    result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")

    profile_data = None
    if user.profile:
        profile_data = {
            "identityTag": user.profile.identity_tag,
            "currentState": user.profile.current_state,
            "personalityType": user.profile.personality_type,
            "socialStyle": user.profile.social_style,
            "catchphrases": user.profile.catchphrases,
        }

    return success_response({
        "userId": user.id,
        "username": user.username,
        "email": user.email,
        "profile": profile_data,
        "isPremium": user.is_premium,
        "premiumExpiresAt": user.premium_expires_at.isoformat() if user.premium_expires_at else None,
        "createdAt": user.created_at.isoformat(),
    })


@router.put("/{user_id}/profile", summary="更新用户画像")
async def update_user_profile(
    user_id: int,
    req: UpdateProfileRequest,
    current_user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """更新用户画像"""
    if user_id != current_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权修改其他用户画像")

    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        profile = UserProfile(user_id=user_id)
        db.add(profile)

    update_data = req.model_dump(exclude_unset=True, by_alias=False)
    for key, value in update_data.items():
        if hasattr(profile, key):
            setattr(profile, key, value)

    await db.commit()
    await db.refresh(profile)

    return success_response({"message": "画像更新成功"})
