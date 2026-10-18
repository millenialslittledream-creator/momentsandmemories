import database
from middleware.logging import log_event as _log


def get_draft(user_id: str) -> dict | None:
    db = database.get_db()
    result = db.table("event_drafts").select("*").eq("user_id", user_id).execute()
    return result.data[0] if result.data else None


def _set_resume_prompt(form_data: dict, enabled: bool) -> dict:
    updated = dict(form_data or {})
    metadata = updated.get("__mmDraft")
    metadata = dict(metadata) if isinstance(metadata, dict) else {}
    metadata["resumePromptOnReturn"] = enabled
    updated["__mmDraft"] = metadata
    return updated


def mark_draft_closed(user_id: str, data: dict | None = None) -> None:
    """Persist the latest small snapshot and a server-side resume signal."""
    db = database.get_db()
    if data:
        data = {**data, "form_data": _set_resume_prompt(data.get("form_data") or {}, True)}
        db.table("event_drafts").upsert(
            {**data, "user_id": user_id},
            on_conflict="user_id",
        ).execute()
        return
    result = db.table("event_drafts").select("form_data").eq("user_id", user_id).limit(1).execute()
    if not result.data:
        return
    form_data = _set_resume_prompt(result.data[0].get("form_data") or {}, True)
    db.table("event_drafts").update({"form_data": form_data}).eq("user_id", user_id).execute()


def claim_resume_draft(user_id: str) -> dict | None:
    """Claim and clear the one-time prompt so it only appears after a real exit."""
    db = database.get_db()
    result = (
        db.table("event_drafts")
        .select("*")
        .eq("user_id", user_id)
        .eq("form_data->__mmDraft->>resumePromptOnReturn", "true")
        .limit(1)
        .execute()
    )
    if not result.data:
        return None
    draft = result.data[0]
    form_data = _set_resume_prompt(draft.get("form_data") or {}, False)
    claimed = (
        db.table("event_drafts")
        .update({"form_data": form_data})
        .eq("user_id", user_id)
        .eq("form_data->__mmDraft->>resumePromptOnReturn", "true")
        .select("*")
        .execute()
    )
    return claimed.data[0] if claimed.data else None


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
