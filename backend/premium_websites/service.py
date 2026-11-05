import json
import uuid
from datetime import datetime, timezone
import database
from media.validation import IMAGE_TYPES, extension_for, sniff_media_type
from middleware.logging import log_event as _log
from premium_websites.schemas import CreatePremiumSiteRequest, UpdatePremiumSiteRequest

# Public bucket: files are served by URL to anyone who opens a shared site, but cannot be listed,
# and only this backend (service role) can write to it. Created by migration 026.
BUCKET = "premium-site-media"
MAX_IMAGE_BYTES = 10 * 1024 * 1024
MAX_CONTENT_CHARS = 1_000_000


def _contains_local_url(value) -> bool:
    """True if any string in the content is a browser-only URL (blob:) nobody else can load."""
    if isinstance(value, str):
        return value.strip().lower().startswith("blob:")
    if isinstance(value, dict):
        return any(_contains_local_url(v) for v in value.values())
    if isinstance(value, list):
        return any(_contains_local_url(v) for v in value)
    return False


def _assert_publishable_content(content) -> None:
    if len(json.dumps(content, default=str)) > MAX_CONTENT_CHARS:
        raise ValueError("Site content is too large. Upload images instead of embedding them.")
    if _contains_local_url(content):
        raise ValueError("Some images were not uploaded, so visitors could not see them. Refresh the page (Ctrl+Shift+R), re-add the pictures if they disappeared, and publish again.")


def _ensure_bucket(db) -> None:
    """Create the public bucket (same settings as migration 026) if it does not exist yet."""
    try:
        db.storage.create_bucket(BUCKET, options={
            "public": True,
            "file_size_limit": MAX_IMAGE_BYTES,
            "allowed_mime_types": [m for m in IMAGE_TYPES],
        })
    except Exception as exc:
        if not any(word in str(exc).lower() for word in ("already exists", "duplicate", "409")):
            raise


def _upload_creating_bucket_if_missing(db, storage_path: str, content: bytes, mime_type: str) -> None:
    options = {"content-type": mime_type}
    try:
        db.storage.from_(BUCKET).upload(storage_path, content, file_options=options)
    except Exception as exc:
        message = str(exc).lower()
        if "bucket not found" not in message and "not_found" not in message and "404" not in message:
            raise
        _ensure_bucket(db)
        db.storage.from_(BUCKET).upload(storage_path, content, file_options=options)


def upload_site_image(user_id: str, content: bytes) -> dict:
    """Store one image for a premium design in the public premium-site-media bucket."""
    detected = sniff_media_type(content)
    if detected not in IMAGE_TYPES:
        raise ValueError("Only JPEG, PNG, GIF or WebP images can be used in a website")
    if len(content) > MAX_IMAGE_BYTES:
        raise ValueError(f"Image too large: max {MAX_IMAGE_BYTES // (1024 * 1024)}MB")

    db = database.get_db()
    storage_path = f"{user_id}/{uuid.uuid4()}{extension_for(detected)}"
    _upload_creating_bucket_if_missing(db, storage_path, content, detected)
    public_url = db.storage.from_(BUCKET).get_public_url(storage_path)
    _log("premium_websites", "image.uploaded", user_id=user_id, metadata={"size": len(content)})
    return {"public_url": public_url, "storage_path": storage_path}


def _get_owned(db, user_id: str, site_id: str) -> dict:
    result = (
        db.table("premium_websites").select("*").eq("id", site_id).eq("user_id", user_id).execute()
    )
    if not result.data:
        raise ValueError("Website not found")
    return result.data[0]


def create_premium_site(user_id: str, data: CreatePremiumSiteRequest) -> dict:
    _assert_publishable_content(data.content)
    db = database.get_db()
    try:
        result = db.table("premium_websites").insert({
            "user_id": user_id,
            "slug": data.slug,
            "event_key": data.event_key,
            "design_id": data.design_id,
            "theme_id": data.theme_id,
            "content": data.content,
            "published": data.published,
        }).execute()
    except Exception as e:
        if "duplicate key" in str(e).lower():
            raise ValueError("That link is already taken — choose a different one")
        raise

    site = result.data[0]
    _log("premium_websites", "site.created", user_id=user_id, metadata={"id": site["id"]})
    return site


def get_premium_site(user_id: str, site_id: str) -> dict:
    db = database.get_db()
    return _get_owned(db, user_id, site_id)


def list_premium_sites(user_id: str) -> list:
    db = database.get_db()
    return (
        db.table("premium_websites")
        .select("*")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .execute().data
    )


def update_premium_site(user_id: str, site_id: str, data: UpdatePremiumSiteRequest) -> dict:
    db = database.get_db()
    _get_owned(db, user_id, site_id)
    if data.content is not None:
        _assert_publishable_content(data.content)

    updates = data.model_dump(exclude_none=True)
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    try:
        result = (
            db.table("premium_websites")
            .update(updates)
            .eq("id", site_id)
            .eq("user_id", user_id)
            .execute()
        )
    except Exception as e:
        if "duplicate key" in str(e).lower():
            raise ValueError("That link is already taken — choose a different one")
        raise

    _log("premium_websites", "site.updated", user_id=user_id, metadata={"id": site_id})
    return result.data[0]


def delete_premium_site(user_id: str, site_id: str) -> None:
    db = database.get_db()
    _get_owned(db, user_id, site_id)
    db.table("premium_websites").delete().eq("id", site_id).eq("user_id", user_id).execute()
    _log("premium_websites", "site.deleted", user_id=user_id, metadata={"id": site_id})


def get_public_premium_site_by_slug(slug: str) -> dict:
    db = database.get_db()
    result = (
        db.table("premium_websites")
        .select("slug,event_key,design_id,theme_id,content,published")
        .eq("slug", slug)
        .eq("published", True)
        .execute()
    )
    if not result.data:
        raise ValueError("Website not found")
    return result.data[0]
