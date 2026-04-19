from datetime import datetime, timezone
import database
from middleware.logging import log_event as _log
from events.schemas import CreateEventRequest, UpdateEventRequest, InviteeIn


def create_event(user_id: str, data: CreateEventRequest) -> dict:
    db = database.get_db()
    payload = {k: v for k, v in data.model_dump().items() if v is not None}
    payload["user_id"] = user_id
    payload["status"] = "draft"
    result = db.table("events").insert(payload).execute()
    event = result.data[0]
    _log("events", "event.created", user_id=user_id, metadata={"event_id": event["id"]})
    return event


def list_events(user_id: str, limit: int = 50, offset: int = 0) -> list:
    db = database.get_db()
    return (
        db.table("events")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .offset(offset)
        .execute().data
    )


def get_event(user_id: str, event_id: str) -> dict:
    db = database.get_db()
    result = db.table("events").select("*").eq("id", event_id).eq("user_id", user_id).execute()
    if not result.data:
        raise ValueError("Event not found")
    return result.data[0]


def update_event(user_id: str, event_id: str, data: UpdateEventRequest) -> dict:
    db = database.get_db()
    get_event(user_id, event_id)  # ownership check
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = db.table("events").update(updates).eq("id", event_id).execute()
    _log("events", "event.updated", user_id=user_id, metadata={"event_id": event_id})
    return result.data[0]


def delete_event(user_id: str, event_id: str) -> dict:
    db = database.get_db()
    get_event(user_id, event_id)  # ownership check — raises if not found
    db.table("events").delete().eq("id", event_id).execute()
    _log("events", "event.deleted", user_id=user_id, metadata={"event_id": event_id})
    return {"deleted": True}


def add_invitees(event_id: str, invitees: list) -> list:
    db = database.get_db()
    rows = [{k: v for k, v in inv.model_dump().items() if v is not None} for inv in invitees]
    for row in rows:
        row["event_id"] = event_id
    result = db.table("event_invitees").insert(rows).execute()
    _log("events", "invitees.added", metadata={"event_id": event_id, "count": len(rows)})
    return result.data


def list_invitees(event_id: str) -> list:
    db = database.get_db()
    return db.table("event_invitees").select("*").eq("event_id", event_id).execute().data


def remove_invitee(event_id: str, invitee_id: str) -> dict:
    db = database.get_db()
    db.table("event_invitees").delete().eq("id", invitee_id).eq("event_id", event_id).execute()
    _log("events", "invitee.removed", metadata={"invitee_id": invitee_id})
    return {"deleted": True}
