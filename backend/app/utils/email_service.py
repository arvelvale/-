"""
邮件发送服务 + 验证码管理（内存存储，支持Redis可选）
"""

import asyncio
import random
import smtplib
import ssl
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Tuple

from app.config import get_settings

settings = get_settings()

# ── 内存验证码存储 {email: (code, expire_ts)} ──────────────────
_code_store: Dict[str, Tuple[str, float]] = {}


def _generate_code() -> str:
    return str(random.randint(100000, 999999))


def _store_code(email: str, code: str) -> None:
    expire_ts = time.time() + settings.email_code_expire_seconds
    _code_store[email] = (code, expire_ts)


def verify_code(email: str, code: str) -> bool:
    """验证验证码是否正确且未过期，验证成功后立即删除"""
    entry = _code_store.get(email)
    if not entry:
        return False
    stored_code, expire_ts = entry
    if time.time() > expire_ts:
        _code_store.pop(email, None)
        return False
    if stored_code != code.strip():
        return False
    _code_store.pop(email, None)
    return True


def _build_email_html(code: str) -> str:
    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#EEF1FF;font-family:'PingFang SC',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="480" style="background:white;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(100,120,200,0.12);">
        <tr>
          <td style="background:linear-gradient(135deg,#7C8FD4,#C4B5FD);padding:32px 40px;text-align:center;">
            <div style="width:48px;height:48px;background:rgba(255,255,255,0.25);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:22px;font-weight:bold;color:white;line-height:48px;">印</div>
            <h1 style="color:white;font-size:22px;margin:12px 0 0;font-weight:700;">印记</h1>
            <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:6px 0 0;">记录生活，认识自己</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="color:#2D3250;font-size:18px;margin:0 0 12px;">邮箱验证码</h2>
            <p style="color:#8A94B8;font-size:14px;line-height:1.6;margin:0 0 28px;">
              你正在登录/注册<b style="color:#2D3250;">印记</b>，验证码为：
            </p>
            <div style="background:linear-gradient(135deg,#EEF1FF,#F5F0FF);border-radius:16px;padding:24px;text-align:center;margin:0 0 28px;">
              <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#7C8FD4;">{code}</span>
            </div>
            <p style="color:#C4C9E8;font-size:12px;line-height:1.6;margin:0;">
              验证码 <b>5分钟</b> 内有效，请勿泄露给他人。<br>
              如非本人操作，请忽略此邮件。
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #F0F4FF;text-align:center;">
            <p style="color:#C4C9E8;font-size:11px;margin:0;">© 2026 印记 · 用心记录每一天</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""


async def send_verification_code(email: str) -> str:
    """生成验证码并异步发送邮件，返回验证码（供测试用）"""
    code = _generate_code()
    _store_code(email, code)

    # 若未配置QQ邮箱则仅存储（开发模式打印到日志）
    if not settings.qq_email or not settings.qq_email_auth_code:
        import logging
        logging.getLogger(__name__).warning(
            f"[DEV] Email not configured. Verification code for {email}: {code}"
        )
        return code

    # 在线程池中执行同步SMTP操作，避免阻塞事件循环
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _send_smtp, email, code)
    return code


def _send_smtp(to_email: str, code: str) -> None:
    """同步SMTP发送（在executor中调用）"""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"【印记】验证码：{code}"
    msg["From"] = f"印记 <{settings.qq_email}>"
    msg["To"] = to_email

    msg.attach(MIMEText(_build_email_html(code), "html", "utf-8"))

    ctx = ssl.create_default_context()
    with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, context=ctx) as server:
        server.login(settings.qq_email, settings.qq_email_auth_code)
        server.sendmail(settings.qq_email, to_email, msg.as_string())
