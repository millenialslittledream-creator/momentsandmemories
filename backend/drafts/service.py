import database
from middleware.logging import log_event as _log


def get_draft(user_id: str) -> dict | None:
    db = database.get_db()
    result = db.table("event_drafts").select("*").eq("user_id", user_id).execute()
    return result.data[0] if result.data else None


def upsert_draft(user_id: str, data: dict) -> dict:
    db = database.get_db()
    result = db.table("event_drafts").upsert(
        {**data, "user_id": user_id},
        on_conflict="user_id",
    ).execute()
    _log("drafts", "draft.saved", user_id=user_id, metadata={"step": data.get("step")})
    return result.data[0]


def delete_draft(user_id: str) -> None:
    db = database.get_db()
    db.table("event_drafts").delete().eq("user_id", user_id).execute()
    _log("drafts", "draft.deleted", user_id=user_id)
