"""
印记 - 用户相关Schema
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class UserProfileData(BaseModel):
    identity_tag: Optional[str] = Field(None, alias="identityTag", description="身份标签")
    current_state: Optional[str] = Field(None, alias="currentState", description="当前状态")
    personality_type: Optional[str] = Field(None, alias="personalityType", description="MBTI类型")
    social_style: Optional[str] = Field(None, alias="socialStyle", description="朋友圈风格")
    catchphrases: Optional[List[str]] = Field(None, description="口头禅列表")

    model_config = {"populate_by_name": True}


class UserProfileResponse(BaseModel):
    user_id: int = Field(alias="userId")
    username: str
    email: str
    profile: Optional[UserProfileData] = None
    is_premium: bool = Field(alias="isPremium", default=False)
    premium_expires_at: Optional[str] = Field(None, alias="premiumExpiresAt")
    created_at: str = Field(alias="createdAt")

    model_config = {"populate_by_name": True}


class UpdateProfileRequest(BaseModel):
    identity_tag: Optional[str] = Field(None, alias="identityTag")
    current_state: Optional[str] = Field(None, alias="currentState")
    personality_type: Optional[str] = Field(None, alias="personalityType")
    social_style: Optional[str] = Field(None, alias="socialStyle")
    catchphrases: Optional[List[str]] = Field(None)

    model_config = {"populate_by_name": True}
