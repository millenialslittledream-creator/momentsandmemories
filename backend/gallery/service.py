import uuid
import database
from middleware.logging import log_event as _log

BUCKET = "user-uploads"
MAX_IMAGE_BYTES = 10 * 1024 * 1024


def _assert_event_published(db, event_id: str) -> None:
    result = db.table("events").select("id").eq("id", event_id).eq("status", "published").execute()
    if not result.data:
        raise ValueError("Event not found or not accepting photos")


def _assert_owns_event(db, user_id: str, event_id: str) -> None:
    result = db.table("events").select("id").eq("id", event_id).eq("user_id", user_id).execute()
    if not result.data:
        raise ValueError("Event not found")


def upload_guest_photo(event_id: str, uploaded_by_name: str | None, filename: str, content: bytes, mime_type: str) -> dict:
    db = database.get_db()
    _assert_event_published(db, event_id)

    if not mime_type or not mime_type.startswith("image/"):
        raise ValueError("Only image files can be shared to the gallery")
    if len(content) > MAX_IMAGE_BYTES:
        raise ValueError(f"File too large — max {MAX_IMAGE_BYTES // (1024 * 1024)}MB")

    storage_path = f"gallery/{event_id}/{uuid.uuid4()}_{filename}"
    db.storage.from_(BUCKET).upload(storage_path, content, file_options={"content-type": mime_type})
    public_url = db.storage.from_(BUCKET).get_public_url(storage_path)

    result = db.table("event_gallery_photos").insert({
        "event_id": event_id,
        "storage_path": storage_path,
        "public_url": public_url,
        "mime_type": mime_type,
        "file_size_bytes": len(content),
        "uploaded_by_name": uploaded_by_name,
    }).execute()

    photo = result.data[0]
    _log("gallery", "photo.uploaded", metadata={"event_id": event_id, "photo_id": photo["id"]})
    return photo


def list_approved_photos(event_id: str) -> list:
    db = database.get_db()
    _assert_event_published(db, event_id)
    return (
        db.table("event_gallery_photos")
        .select("*")
        .eq("event_id", event_id)
        .eq("approved", True)
        .order("created_at", desc=True)
        .execute().data
    )


def list_photos_for_owner(user_id: str, event_id: str) -> list:
    db = database.get_db()
    _assert_owns_event(db, user_id, event_id)
    return (
        db.table("event_gallery_photos")
        .select("*")
        .eq("event_id", event_id)
        .order("created_at", desc=True)
        .execute().data
    )


def _get_owned_photo(db, user_id: str, photo_id: str) -> dict:
    result = db.table("event_gallery_photos").select("*").eq("id", photo_id).execute()
    if not result.data:
        raise ValueError("Photo not found")
    photo = result.data[0]
    try:
        _assert_owns_event(db, user_id, photo["event_id"])
    except ValueError:
        raise ValueError("Photo not found")
    return photo


def set_photo_approval(user_id: str, photo_id: str, approved: bool) -> dict:
    db = database.get_db()
    _get_owned_photo(db, user_id, photo_id)
    result = db.table("event_gallery_photos").update({"approved": approved}).eq("id", photo_id).execute()
    _log("gallery", "photo.moderated", user_id=user_id, metadata={"photo_id": photo_id, "approved": approved})
    return result.data[0]


def delete_photo(user_id: str, photo_id: str) -> None:
    db = database.get_db()
    photo = _get_owned_photo(db, user_id, photo_id)
    db.storage.from_(BUCKET).remove([photo["storage_path"]])
    db.table("event_gallery_photos").delete().eq("id", photo_id).execute()
    _log("gallery", "photo.deleted", user_id=user_id, metadata={"photo_id": photo_id})
