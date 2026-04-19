import urllib.parse
from datetime import datetime, timezone
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from twilio.rest import Client
import database
from config import settings
from middleware.logging import log_event as _log
from notifications.schemas import SendNotificationRequest


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
            client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
            client.messages.create(
                body=f"{data.title}: {data.body}",
                from_=settings.twilio_from_number,
                to=data.recipient,
            )
        elif data.type == "whatsapp":
            pass  # WhatsApp is a deep link — no server call needed

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


def list_notifications(user_id: str) -> list:
    db = database.get_db()
    return db.table("notifications").select("*").eq("user_id", user_id).order("created_at", desc=True).execute().data
