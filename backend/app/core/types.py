"""
印记 - 自定义数据库类型
兼容 PostgreSQL（JSONB）和 SQLite（JSON）
"""

from sqlalchemy import JSON, Integer, BigInteger
from sqlalchemy.types import TypeDecorator

from app.config import get_settings


def get_json_type():
    """根据数据库类型返回合适的JSON列类型"""
    settings = get_settings()
    if settings.use_sqlite:
        return JSON
    else:
        from sqlalchemy.dialects.postgresql import JSONB
        return JSONB


def get_pk_type():
    """根据数据库类型返回合适的主键列类型
    SQLite 要求 INTEGER PRIMARY KEY 才能自增（BigInteger 映射为 BIGINT，不满足）
    PostgreSQL 使用 BigInteger 支持大范围ID
    """
    settings = get_settings()
    if settings.use_sqlite:
        return Integer
    else:
        return BigInteger
