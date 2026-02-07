"""
印记 - 全局异常处理
统一错误响应格式
"""

from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import ORJSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.middleware.trace import get_trace_id


def _error_response(status_code: int, code: str, message: str, details=None):
    """构造统一错误响应"""
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
    return ORJSONResponse(status_code=status_code, content=body)


def register_exception_handlers(app: FastAPI):
    """注册全局异常处理器"""

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        code_map = {
            400: "INVALID_PARAMS",
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            429: "RATE_LIMIT_EXCEEDED",
            500: "INTERNAL_ERROR",
            503: "LLM_TIMEOUT",
        }
        code = code_map.get(exc.status_code, "UNKNOWN_ERROR")
        return _error_response(
            status_code=exc.status_code,
            code=code,
            message=str(exc.detail),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ):
        errors = []
        for error in exc.errors():
            errors.append(
                {
                    "field": ".".join(str(loc) for loc in error["loc"]),
                    "reason": error["msg"],
                }
            )
        return _error_response(
            status_code=422,
            code="INVALID_PARAMS",
            message="参数验证失败",
            details=errors,
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        from loguru import logger

        logger.exception(f"未捕获异常: {exc}")
        return _error_response(
            status_code=500,
            code="INTERNAL_ERROR",
            message="服务器内部错误，请稍后重试",
        )
