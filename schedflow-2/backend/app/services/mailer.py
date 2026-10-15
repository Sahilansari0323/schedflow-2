"""Simple SMTP mailer for substitution notifications.

Sends asynchronously in a daemon thread so API responses never block.
When SMTP_HOST is empty (default dev setup), emails are "sent" to the
application log instead and marked as skipped.
"""

import smtplib
import threading
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import get_settings

settings = get_settings()


def mail_enabled() -> bool:
    return bool(settings.SMTP_HOST)


def _send_sync(to: str, subject: str, html: str):
    msg = MIMEMultipart("alternative")
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(html, "html", "utf-8"))
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
        if settings.SMTP_USER:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.EMAIL_FROM, [to], msg.as_string())


def send_email(to: str, subject: str, html: str) -> str:
    """Fire-and-forget. Returns 'sent' (queued), 'skipped' or raises nothing."""
    if not to or "@" not in to:
        return "skipped"
    if not mail_enabled():
        print(f"[SchedFlow mail:skipped] to={to} subject={subject!r} (SMTP_HOST not configured)")
        return "skipped"

    def worker():
        try:
            _send_sync(to, subject, html)
        except Exception as exc:  # noqa: BLE001
            print(f"[SchedFlow mail:failed] to={to} subject={subject!r}: {exc}")

    threading.Thread(target=worker, daemon=True).start()
    return "sent"


def substitution_email_html(teacher_name: str, items: list[dict], on_leave: str) -> str:
    rows = "".join(
        f"<tr><td style='padding:6px 12px;border:1px solid #ddd'>{i['slot']}</td>"
        f"<td style='padding:6px 12px;border:1px solid #ddd'>{i['subject_code']} — {i['subject_name']}</td>"
        f"<td style='padding:6px 12px;border:1px solid #ddd'>Section {i['section_name']}</td>"
        f"<td style='padding:6px 12px;border:1px solid #ddd'>{i['room_name']}</td></tr>"
        for i in items
    )
    return f"""
    <div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px">
      <h2 style="color:#4f46e5">Substitution assignment — SchedFlow</h2>
      <p>Hi {teacher_name},</p>
      <p>You have been assigned as the substitute for <b>{on_leave}</b>'s classes.
         Please take the following sessions:</p>
      <table style="border-collapse:collapse;font-size:14px">
        <tr style="background:#eef2ff"><th style="padding:6px 12px;border:1px solid #ddd">Slot</th>
            <th style="padding:6px 12px;border:1px solid #ddd">Subject</th>
            <th style="padding:6px 12px;border:1px solid #ddd">Section</th>
            <th style="padding:6px 12px;border:1px solid #ddd">Room</th></tr>
        {rows}
      </table>
      <p style="color:#888;font-size:12px">Sent automatically by SchedFlow.</p>
    </div>
    """
