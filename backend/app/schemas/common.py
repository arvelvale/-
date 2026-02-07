"""
印记 - 通用响应模型
统一响应格式
"""

from datetime import datetime, timezone
from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel, Field

from app.middleware.trace import get_trace_id

T = TypeVar("T")


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None


class ApiResponse(BaseModel, Generic[T]):
    """统一API响应格式"""
    trace_id: str = Field(alias="traceId", default="")
    success: bool = True
    data: Optional[T] = None
    error: Optional[ErrorDetail] = None
    timestamp: str = ""

    model_config = {"populate_by_name": True}


def success_response(data: Any = None) -> dict:
    """构造成功响应"""
    return {
        "traceId": get_trace_id(),
        "success": True,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def error_response(code: str, message: str, details: Any = None) -> dict:
    """构造错误响应"""
    body = {
        "traceId": get_trace_id(),
        "success": False,
        "error": {
            "code": code,
            "message": message,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    if details:
        body["error"]["details"] = details
    return body
