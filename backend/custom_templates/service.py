from datetime import datetime, timezone
import database
from middleware.logging import log_event as _log
from custom_templates.schemas import CreateUserTemplateRequest, UpdateUserTemplateRequest


def create_user_template(user_id: str, data: CreateUserTemplateRequest) -> dict:
    db = database.get_db()
    result = db.table("user_templates").insert({
        "user_id": user_id,
        "name": data.name,
        "event_type": data.event_type,
        "event_id": data.event_id,
        "canvas_width": data.canvas_width,
        "canvas_height": data.canvas_height,
        "background": data.background,
        "elements": data.elements,
        "is_draft": data.is_draft,
    }).execute()

    _log("custom_templates", "template.created", user_id=user_id, metadata={"id": result.data[0]["id"]})
    return result.data[0]


def _get_owned(db, user_id: str, template_id: str) -> dict:
    result = db.table("user_templates").select("*").eq("id", template_id).eq("user_id", user_id).execute()
    if not result.data:
        raise ValueError("Template not found")
    return result.data[0]


def get_user_template(user_id: str, template_id: str) -> dict:
    db = database.get_db()
    return _get_owned(db, user_id, template_id)


def update_user_template(user_id: str, template_id: str, data: UpdateUserTemplateRequest) -> dict:
    db = database.get_db()
    _get_owned(db, user_id, template_id)

    updates = data.model_dump(exclude_none=True)
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = db.table("user_templates").update(updates).eq("id", template_id).eq("user_id", user_id).execute()

    _log("custom_templates", "template.updated", user_id=user_id, metadata={"id": template_id})
    return result.data[0]


def delete_user_template(user_id: str, template_id: str) -> None:
    db = database.get_db()
    _get_owned(db, user_id, template_id)
    db.table("user_templates").delete().eq("id", template_id).eq("user_id", user_id).execute()
    _log("custom_templates", "template.deleted", user_id=user_id, metadata={"id": template_id})


def list_user_templates(user_id: str, limit: int = 50, offset: int = 0) -> list:
    db = database.get_db()
    return (
        db.table("user_templates")
        .select("*")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .limit(limit)
        .offset(offset)
        .execute().data
    )
