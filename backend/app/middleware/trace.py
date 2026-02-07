"""
印记 - TraceId 追踪中间件
每个请求自动生成或传递 traceId，贯穿整个请求链路
"""

import uuid
from contextvars import ContextVar

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# 使用 ContextVar 在异步环境中安全传递 traceId
trace_id_var: ContextVar[str] = ContextVar("trace_id", default="")


def get_trace_id() -> str:
    """获取当前请求的 traceId"""
    return trace_id_var.get()


class TraceIdMiddleware(BaseHTTPMiddleware):
    """
    TraceId 追踪中间件

    流程:
    1. 从请求头 X-Trace-Id 获取 traceId
    2. 如果没有，自动生成 UUID v4
    3. 注入到 ContextVar，供后续服务使用
    4. 在响应头中返回 X-Trace-Id
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        # 从请求头获取或自动生成
        trace_id = request.headers.get("X-Trace-Id", str(uuid.uuid4()))

        # 注入到上下文变量
        token = trace_id_var.set(trace_id)

        try:
            response: Response = await call_next(request)
            # 在响应头中返回 traceId
            response.headers["X-Trace-Id"] = trace_id
            return response
        finally:
            trace_id_var.reset(token)
