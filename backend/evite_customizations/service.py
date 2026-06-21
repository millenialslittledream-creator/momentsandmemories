from datetime import datetime, timezone
import database
from middleware.logging import log_event as _log
from evite_customizations.schemas import (
    CreateEviteCustomizationRequest,
    UpdateEviteCustomizationRequest,
)


def _assert_owns_event(db, user_id: str, event_id: str) -> None:
    result = db.table("events").select("id").eq("id", event_id).eq("user_id", user_id).execute()
    if not result.data:
        raise ValueError("Event not found")


def _get_owned(db, user_id: str, customization_id: str) -> dict:
    result = (
        db.table("evite_customizations")
        .select("*")
        .eq("id", customization_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise ValueError("Customization not found")
    return result.data[0]


def create_evite_customization(user_id: str, data: CreateEviteCustomizationRequest) -> dict:
    db = database.get_db()
    if data.event_id:
        _assert_owns_event(db, user_id, data.event_id)

    result = db.table("evite_customizations").insert({
        "event_id": data.event_id,
        "user_id": user_id,
        "template_id": data.template_id,
        "field_overrides": data.field_overrides,
        "photo_overlay": data.photo_overlay,
    }).execute()

    customization = result.data[0]
    _log("evite_customizations", "customization.created", user_id=user_id, metadata={"id": customization["id"]})
    return customization


def get_evite_customization(user_id: str, customization_id: str) -> dict:
    db = database.get_db()
    return _get_owned(db, user_id, customization_id)


def get_evite_customizations_by_event(user_id: str, event_id: str) -> list:
    db = database.get_db()
    _assert_owns_event(db, user_id, event_id)
    return (
        db.table("evite_customizations")
        .select("*")
        .eq("event_id", event_id)
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .execute().data
    )


def update_evite_customization(
    user_id: str, customization_id: str, data: UpdateEviteCustomizationRequest
) -> dict:
    db = database.get_db()
    _get_owned(db, user_id, customization_id)

    if data.event_id is not None:
        _assert_owns_event(db, user_id, data.event_id)

    updates = data.model_dump(exclude_unset=True)
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = (
        db.table("evite_customizations")
        .update(updates)
        .eq("id", customization_id)
        .eq("user_id", user_id)
        .execute()
    )

    _log("evite_customizations", "customization.updated", user_id=user_id, metadata={"id": customization_id})
    return result.data[0]


def delete_evite_customization(user_id: str, customization_id: str) -> None:
    db = database.get_db()
    _get_owned(db, user_id, customization_id)
    db.table("evite_customizations").delete().eq("id", customization_id).eq("user_id", user_id).execute()
    _log("evite_customizations", "customization.deleted", user_id=user_id, metadata={"id": customization_id})
