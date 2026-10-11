import database
from middleware.logging import log_event as _log


def _assert_owns_event(db, user_id: str, event_id: str) -> None:
    result = db.table("events").select("id").eq("id", event_id).eq("user_id", user_id).execute()
    if not result.data:
        raise ValueError("Event not found")


def _insert_message(
    db, event_id: str, sender_id: str, sender_type: str, sender_name: str, body: str
) -> dict:
    if not body.strip():
        raise ValueError("Message body cannot be empty")
    result = db.table("event_messages").insert({
        "event_id": event_id,
        "sender_id": sender_id,
        "sender_type": sender_type,
        "sender_name": sender_name,
        "body": body.strip(),
    }).execute()
    _log("messaging", "message.sent", metadata={"event_id": event_id, "sender_type": sender_type})
    return result.data[0]


def send_organiser_message(user_id: str, event_id: str, sender_name: str, body: str) -> dict:
    db = database.get_db()
    _assert_owns_event(db, user_id, event_id)
    return _insert_message(db, event_id, user_id, "organiser", sender_name, body)


def send_guest_message(event_id: str, invitee_id: str, sender_name: str, body: str) -> dict:
    """A guest reply from the RSVP page: the invitee must really belong to a published event."""
    db = database.get_db()
    event = db.table("events").select("id").eq("id", event_id).eq("status", "published").execute()
    if not event.data:
        raise ValueError("Event not found")
    invitee = (
        db.table("event_invitees").select("id,name").eq("id", invitee_id).eq("event_id", event_id).execute()
    )
    if not invitee.data:
        raise ValueError("Invitee not found for this event")
    name = sender_name or invitee.data[0].get("name") or "Guest"
    return _insert_message(db, event_id, invitee_id, "guest", name, body)


def list_messages(user_id: str, event_id: str, limit: int = 100, offset: int = 0) -> list:
    db = database.get_db()
    _assert_owns_event(db, user_id, event_id)
    return (
        db.table("event_messages")
        .select("*")
        .eq("event_id", event_id)
        .order("created_at", desc=False)
        .limit(limit)
        .offset(offset)
        .execute().data
    )
