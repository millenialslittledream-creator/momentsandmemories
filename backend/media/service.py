import uuid
import database
from middleware.logging import log_event as _log

BUCKET = "user-uploads"
MAX_IMAGE_BYTES = 10 * 1024 * 1024
MAX_VIDEO_BYTES = 50 * 1024 * 1024
ALLOWED_VIDEO_TYPES = ("video/mp4", "video/quicktime")


def _kind_for(mime_type: str) -> str:
    if mime_type and mime_type.startswith("image/"):
        return "image"
    if mime_type in ALLOWED_VIDEO_TYPES:
        return "video"
    raise ValueError(f"Unsupported file type: {mime_type!r}")


def upload_media(user_id: str, filename: str, content: bytes, mime_type: str) -> dict:
    kind = _kind_for(mime_type)
    max_bytes = MAX_IMAGE_BYTES if kind == "image" else MAX_VIDEO_BYTES
    if len(content) > max_bytes:
        raise ValueError(f"File too large — max {max_bytes // (1024 * 1024)}MB for {kind}")

    db = database.get_db()
    storage_path = f"{user_id}/{uuid.uuid4()}_{filename}"
    db.storage.from_(BUCKET).upload(
        storage_path, content, file_options={"content-type": mime_type}
    )
    public_url = db.storage.from_(BUCKET).get_public_url(storage_path)

    result = db.table("media_uploads").insert({
        "user_id": user_id,
        "storage_path": storage_path,
        "public_url": public_url,
        "kind": kind,
        "mime_type": mime_type,
        "file_size_bytes": len(content),
    }).execute()

    _log("media", "media.uploaded", user_id=user_id, metadata={"kind": kind, "size": len(content)})
    return result.data[0]


def delete_media(user_id: str, media_id: str) -> None:
    db = database.get_db()
    result = db.table("media_uploads").select("*").eq("id", media_id).eq("user_id", user_id).execute()
    if not result.data:
        raise ValueError("Upload not found")

    storage_path = result.data[0]["storage_path"]
    db.storage.from_(BUCKET).remove([storage_path])
    db.table("media_uploads").delete().eq("id", media_id).execute()
    _log("media", "media.deleted", user_id=user_id, metadata={"media_id": media_id})


def list_media(user_id: str, limit: int = 50, offset: int = 0) -> list:
    db = database.get_db()
    return (
        db.table("media_uploads")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .offset(offset)
        .execute().data
    )
