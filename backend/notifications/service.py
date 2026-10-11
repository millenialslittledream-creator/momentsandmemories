import html
import re
import urllib.parse
from datetime import datetime, timezone
from typing import List, Optional
import boto3
import httpx
from botocore.exceptions import ClientError
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import database
from config import settings
from middleware.logging import log_event as _log
from notifications.schemas import SendNotificationRequest, BulkRecipient


TELNYX_MESSAGES_URL = "https://api.telnyx.com/v2/messages"


class SmsSendError(Exception):
    """Raised when Telnyx rejects or fails to accept an SMS."""


_E164 = re.compile(r"^\+[1-9][0-9]{6,14}$")
_EMAIL = re.compile(r"^[^\s@<>\",;]+@[^\s@<>\",;]+\.[^\s@<>\",;]+$")
MAX_BULK_RECIPIENTS = 200


def _validate_sms_destination(to: str) -> None:
    """Only well-formed numbers in allowed countries: the main defence against SMS pumping."""
    if not _E164.match(to or ""):
        raise SmsSendError("Invalid phone number (expected international format, e.g. +15551234567)")
    prefixes = [p.strip() for p in settings.sms_allowed_prefixes.split(",") if p.strip()]
    if prefixes and not any(to.startswith(prefix) for prefix in prefixes):
        raise SmsSendError("SMS to this country is not enabled")


def _send_sms(to: str, text: str) -> str:
    """Send one SMS via Telnyx and return the Telnyx message id."""
    _validate_sms_destination(to)
    payload = {"from": settings.telnyx_from_number, "to": to, "text": text}
    if settings.telnyx_messaging_profile_id:
        payload["messaging_profile_id"] = settings.telnyx_messaging_profile_id
    try:
        resp = httpx.post(
            TELNYX_MESSAGES_URL,
            json=payload,
            headers={"Authorization": f"Bearer {settings.telnyx_api_key}"},
            timeout=15.0,
        )
    except httpx.HTTPError as exc:
        raise SmsSendError(f"Telnyx request failed: {exc}") from exc
    if resp.status_code >= 400:
        raise SmsSendError(f"Telnyx rejected SMS ({resp.status_code}): {resp.text}")
    return resp.json().get("data", {}).get("id", "")


def _save_notification(data: SendNotificationRequest) -> str:
    db = database.get_db()
    result = db.table("notifications").insert({
        "user_id": data.user_id,
        "type": data.type,
        "channel": _channel_name(data.type),
        "title": data.title,
        "body": data.body,
        "recipient": data.recipient,
        "status": "pending",
    }).execute()
    return result.data[0]["id"]


def _channel_name(ntype: str) -> str:
    return {"email": "sendgrid", "sms": "telnyx", "whatsapp": "whatsapp_link"}.get(ntype, ntype)


def _mark_sent(notif_id: str) -> None:
    db = database.get_db()
    db.table("notifications").update({
        "status": "sent",
        "sent_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", notif_id).execute()


def _mark_failed(notif_id: str, error: str) -> None:
    db = database.get_db()
    db.table("notifications").update({
        "status": "failed",
        "error_message": error,
    }).eq("id", notif_id).execute()


def _as_html(text: str) -> str:
    """User-supplied text goes into emails as escaped text, never as markup."""
    return html.escape(text).replace("\n", "<br>")


def send_notification(user_id: str, data: SendNotificationRequest) -> dict:
    # Never trust a user_id from the request body: attribute to the authenticated caller.
    data = data.model_copy(update={"user_id": user_id})
    if data.type == "email" and not _EMAIL.match(data.recipient):
        raise ValueError("Invalid email address")
    if data.type == "sms":
        _validate_sms_destination(data.recipient)
    notif_id = _save_notification(data)
    try:
        if data.type == "email":
            sg = SendGridAPIClient(settings.sendgrid_api_key)
            msg = Mail(
                from_email="noreply@momentsandmemories.com",
                to_emails=data.recipient,
                subject=data.title,
                html_content=_as_html(data.body),
            )
            sg.send(msg)
        elif data.type == "sms":
            _send_sms(data.recipient, f"{data.title}: {data.body}")
        elif data.type == "whatsapp":
            pass  # WhatsApp is a deep link — no server call needed
        else:
            raise ValueError(f"Unsupported notification type: {data.type!r}")

        _mark_sent(notif_id)
        _log("notifications", "notification.sent", user_id=data.user_id,
             metadata={"type": data.type})
        return {"id": notif_id, "status": "sent"}

    except Exception as e:
        _mark_failed(notif_id, str(e))
        _log("notifications", "notification.failed", level="error",
             metadata={"type": data.type, "error": str(e)[:300]})
        raise


def get_whatsapp_link(message: str) -> str:
    encoded = urllib.parse.quote(message)
    return f"https://wa.me/?text={encoded}"


# ── Bulk messaging (Amazon SES for email, Telnyx for SMS) ─────────────────────

def bulk_send(
    user_id: str,
    event_id: Optional[str],
    recipients: Optional[List[BulkRecipient]],
    channel: str,
    subject: str,
    body: str,
    background_tasks,
) -> dict:
    """Queue a bulk send and return immediately. Actual delivery runs in background."""
    if event_id:
        db = database.get_db()
        owned = db.table("events").select("id").eq("id", event_id).eq("user_id", user_id).execute()
        if not owned.data:
            raise ValueError("Event not found")
    if event_id and not recipients:
        db = database.get_db()
        rows = db.table("event_invitees").select("*").eq("event_id", event_id).execute().data
        recipients = [
            BulkRecipient(
                email=r.get("email"),
                phone=r.get("phone"),
                name=r.get("name", ""),
            )
            for r in rows
        ]

    recipients = recipients or []
    if len(recipients) > MAX_BULK_RECIPIENTS:
        raise ValueError(f"Too many recipients (max {MAX_BULK_RECIPIENTS} per send)")
    background_tasks.add_task(_do_bulk_send, recipients, channel, subject, body)
    return {"total": len(recipients), "status": "processing"}


def _do_bulk_send(
    recipients: List[BulkRecipient],
    channel: str,
    subject: str,
    body: str,
) -> None:
    """Background task — sends one message per recipient and logs each attempt."""
    if channel == "email":
        ses = boto3.client(
            "ses",
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id or None,
            aws_secret_access_key=settings.aws_secret_access_key or None,
        )
        for r in recipients:
            if not r.email:
                continue
            personalized = _as_html(body).replace("{name}", html.escape(r.name))
            try:
                ses.send_email(
                    Source=settings.ses_from_email,
                    Destination={"ToAddresses": [r.email]},
                    Message={
                        "Subject": {"Data": subject, "Charset": "UTF-8"},
                        "Body": {"Html": {"Data": personalized, "Charset": "UTF-8"}},
                    },
                )
                _log("notifications", "bulk.email.sent")
            except ClientError as exc:
                _log("notifications", "bulk.email.failed", level="error",
                     metadata={"error": str(exc)[:300]})

    elif channel == "sms":
        for r in recipients:
            if not r.phone:
                continue
            personalized = body.replace("{name}", r.name)
            try:
                _send_sms(r.phone, f"{subject}: {personalized}")
                _log("notifications", "bulk.sms.sent")
            except SmsSendError as exc:
                _log("notifications", "bulk.sms.failed", level="error",
                     metadata={"error": str(exc)[:300]})


def list_notifications(user_id: str, limit: int = 50, offset: int = 0) -> list:
    db = database.get_db()
    return (
        db.table("notifications")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .offset(offset)
        .execute().data
    )
