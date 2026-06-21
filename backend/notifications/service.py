import urllib.parse
from datetime import datetime, timezone
from typing import List, Optional
import boto3
from botocore.exceptions import ClientError
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import database
from config import settings
from middleware.logging import log_event as _log
from notifications.schemas import SendNotificationRequest, BulkRecipient


def _get_sms_client():
    return boto3.client(
        "pinpoint-sms-voice-v2",
        region_name=settings.aws_sms_region,
        aws_access_key_id=settings.aws_sms_access_key_id or None,
        aws_secret_access_key=settings.aws_sms_secret_access_key or None,
    )


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
    return {"email": "sendgrid", "sms": "twilio", "whatsapp": "whatsapp_link"}.get(ntype, ntype)


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


def send_notification(data: SendNotificationRequest) -> dict:
    notif_id = _save_notification(data)
    try:
        if data.type == "email":
            sg = SendGridAPIClient(settings.sendgrid_api_key)
            msg = Mail(
                from_email="noreply@momentsandmemories.com",
                to_emails=data.recipient,
                subject=data.title,
                html_content=data.body,
            )
            sg.send(msg)
        elif data.type == "sms":
            sms = _get_sms_client()
            sms.send_text_message(
                DestinationPhoneNumber=data.recipient,
                OriginationIdentity=settings.sms_origination_number,
                MessageBody=f"{data.title}: {data.body}",
            )
        elif data.type == "whatsapp":
            pass  # WhatsApp is a deep link — no server call needed
        else:
            raise ValueError(f"Unsupported notification type: {data.type!r}")

        _mark_sent(notif_id)
        _log("notifications", "notification.sent", user_id=data.user_id,
             metadata={"type": data.type, "recipient": data.recipient})
        return {"id": notif_id, "status": "sent"}

    except Exception as e:
        _mark_failed(notif_id, str(e))
        _log("notifications", "notification.failed", level="error",
             metadata={"type": data.type, "error": str(e)})
        raise


def get_whatsapp_link(message: str) -> str:
    encoded = urllib.parse.quote(message)
    return f"https://wa.me/?text={encoded}"


# ── Bulk messaging (Amazon SES for email, Twilio for SMS) ─────────────────────

def bulk_send(
    event_id: Optional[str],
    recipients: Optional[List[BulkRecipient]],
    channel: str,
    subject: str,
    body: str,
    background_tasks,
) -> dict:
    """Queue a bulk send and return immediately. Actual delivery runs in background."""
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
            personalized = body.replace("{name}", r.name)
            try:
                ses.send_email(
                    Source=settings.ses_from_email,
                    Destination={"ToAddresses": [r.email]},
                    Message={
                        "Subject": {"Data": subject, "Charset": "UTF-8"},
                        "Body": {"Html": {"Data": personalized, "Charset": "UTF-8"}},
                    },
                )
                _log("notifications", "bulk.email.sent", metadata={"to": r.email})
            except ClientError as exc:
                _log("notifications", "bulk.email.failed", level="error",
                     metadata={"to": r.email, "error": str(exc)})

    elif channel == "sms":
        sms = _get_sms_client()
        for r in recipients:
            if not r.phone:
                continue
            personalized = body.replace("{name}", r.name)
            try:
                sms.send_text_message(
                    DestinationPhoneNumber=r.phone,
                    OriginationIdentity=settings.sms_origination_number,
                    MessageBody=f"{subject}: {personalized}",
                )
                _log("notifications", "bulk.sms.sent", metadata={"to": r.phone})
            except ClientError as exc:
                _log("notifications", "bulk.sms.failed", level="error",
                     metadata={"to": r.phone, "error": str(exc)})


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
