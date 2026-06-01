import database
from middleware.logging import log_event as _log


def send_message(
    event_id: str,
    sender_id: str,
    sender_type: str,
    sender_name: str,
    body: str,
) -> dict:
    if not body.strip():
        raise ValueError("Message body cannot be empty")

    db = database.get_db()
    result = db.table("event_messages").insert({
        "event_id": event_id,
        "sender_id": sender_id,
        "sender_type": sender_type,
        "sender_name": sender_name,
        "body": body.strip(),
    }).execute()

    _log("messaging", "message.sent", metadata={"event_id": event_id, "sender_type": sender_type})
    return result.data[0]


def list_messages(event_id: str, limit: int = 100, offset: int = 0) -> list:
    db = database.get_db()
    return (
        db.table("event_messages")
        .select("*")
        .eq("event_id", event_id)
        .order("created_at", desc=False)
        .limit(limit)
        .offset(offset)
        .execute().data
    )
