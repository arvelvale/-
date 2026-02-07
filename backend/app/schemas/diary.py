"""
印记 - 日记相关Schema
"""

from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field


# ---------- 请求 ----------

class CreateDiaryRequest(BaseModel):
    title: Optional[str] = Field(None, max_length=200, description="日记标题")
    content: str = Field(..., min_length=1, description="日记内容")
    diary_date: date = Field(..., alias="diaryDate", description="日记日期")
    emotion_tags: Optional[List[str]] = Field(None, alias="emotionTags", description="情绪标签")
    importance_score: Optional[int] = Field(5, alias="importanceScore", ge=1, le=10, description="重要性评分")
    images: Optional[List[str]] = Field(None, description="图片URL列表")

    model_config = {"populate_by_name": True}


class UpdateDiaryRequest(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    content: Optional[str] = Field(None)
    emotion_tags: Optional[List[str]] = Field(None, alias="emotionTags")
    importance_score: Optional[int] = Field(None, alias="importanceScore", ge=1, le=10)
    images: Optional[List[str]] = Field(None)

    model_config = {"populate_by_name": True}


# ---------- 响应 ----------

class DiaryBrief(BaseModel):
    diary_id: int = Field(alias="diaryId")
    title: Optional[str] = None
    content_preview: str = Field(alias="contentPreview")
    diary_date: str = Field(alias="diaryDate")
    emotion_tags: Optional[List[str]] = Field(None, alias="emotionTags")
    importance_score: int = Field(alias="importanceScore")
    is_analyzed: bool = Field(alias="isAnalyzed")
    created_at: str = Field(alias="createdAt")

    model_config = {"populate_by_name": True}


class DiaryDetail(BaseModel):
    diary_id: int = Field(alias="diaryId")
    title: Optional[str] = None
    content: str
    content_html: Optional[str] = Field(None, alias="contentHtml")
    diary_date: str = Field(alias="diaryDate")
    emotion_tags: Optional[List[str]] = Field(None, alias="emotionTags")
    importance_score: int = Field(alias="importanceScore")
    word_count: int = Field(alias="wordCount")
    images: Optional[List[str]] = None
    is_analyzed: bool = Field(alias="isAnalyzed")
    created_at: str = Field(alias="createdAt")
    updated_at: str = Field(alias="updatedAt")

    model_config = {"populate_by_name": True}


class DiaryListResponse(BaseModel):
    total: int
    page: int
    page_size: int = Field(alias="pageSize")
    diaries: List[DiaryBrief]

    model_config = {"populate_by_name": True}
