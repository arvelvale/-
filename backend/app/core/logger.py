"""
印记 - 日志配置
使用 loguru 实现结构化日志
"""

import sys
from loguru import logger

from app.config import get_settings


def setup_logger():
    """配置全局日志"""
    settings = get_settings()

    # 移除默认handler
    logger.remove()

    # 日志格式
    log_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
        "<blue>[traceId={extra[trace_id]}]</blue> | "
        "<level>{message}</level>"
    )

    log_format_simple = (
        "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
        "<level>{message}</level>"
    )

    # 控制台输出
    logger.add(
        sys.stdout,
        format=log_format_simple,
        level="DEBUG" if settings.debug else "INFO",
        colorize=True,
    )

    # 文件输出（生产环境）
    if settings.is_production:
        logger.add(
            "logs/app_{time:YYYY-MM-DD}.log",
            format=log_format_simple,
            level="INFO",
            rotation="00:00",  # 每天轮转
            retention="30 days",  # 保留30天
            compression="gz",
            encoding="utf-8",
        )

        # 错误日志单独输出
        logger.add(
            "logs/error_{time:YYYY-MM-DD}.log",
            format=log_format_simple,
            level="ERROR",
            rotation="00:00",
            retention="90 days",
            compression="gz",
            encoding="utf-8",
        )

    return logger
