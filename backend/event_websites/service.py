from datetime import datetime, timezone
import database
from middleware.logging import log_event as _log
from event_websites.schemas import CreateEventWebsiteRequest, UpdateEventWebsiteRequest


def _assert_owns_event(db, user_id: str, event_id: str) -> None:
    result = db.table("events").select("id").eq("id", event_id).eq("user_id", user_id).execute()
    if not result.data:
        raise ValueError("Event not found")


def _get_owned(db, user_id: str, website_id: str) -> dict:
    result = db.table("event_websites").select("*").eq("id", website_id).eq("user_id", user_id).execute()
    if not result.data:
        raise ValueError("Website not found")
    return result.data[0]


def create_event_website(user_id: str, data: CreateEventWebsiteRequest) -> dict:
    db = database.get_db()
    _assert_owns_event(db, user_id, data.event_id)

    existing = db.table("event_websites").select("id").eq("event_id", data.event_id).execute()
    if existing.data:
        raise ValueError("This event already has a website — edit the existing one instead of creating another")

    try:
        result = db.table("event_websites").insert({
            "event_id": data.event_id,
            "user_id": user_id,
            "slug": data.slug,
            "sections": data.sections,
            "theme": data.theme,
            "published": data.published,
        }).execute()
    except Exception as e:
        if "duplicate key" in str(e).lower():
            raise ValueError("That link is already taken — choose a different one")
        raise

    website = result.data[0]
    _log("event_websites", "website.created", user_id=user_id, metadata={"id": website["id"]})
    return website


def get_event_website(user_id: str, website_id: str) -> dict:
    db = database.get_db()
    return _get_owned(db, user_id, website_id)


def update_event_website(user_id: str, website_id: str, data: UpdateEventWebsiteRequest) -> dict:
    db = database.get_db()
    _get_owned(db, user_id, website_id)

    updates = data.model_dump(exclude_none=True)
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    try:
        result = db.table("event_websites").update(updates).eq("id", website_id).eq("user_id", user_id).execute()
    except Exception as e:
        if "duplicate key" in str(e).lower():
            raise ValueError("That link is already taken — choose a different one")
        raise

    _log("event_websites", "website.updated", user_id=user_id, metadata={"id": website_id})
    return result.data[0]


def delete_event_website(user_id: str, website_id: str) -> None:
    db = database.get_db()
    _get_owned(db, user_id, website_id)
    db.table("event_websites").delete().eq("id", website_id).eq("user_id", user_id).execute()
    _log("event_websites", "website.deleted", user_id=user_id, metadata={"id": website_id})


def list_event_websites(user_id: str) -> list:
    db = database.get_db()
    return (
        db.table("event_websites")
        .select("*")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .execute().data
    )


def get_public_website_by_slug(slug: str) -> dict:
    db = database.get_db()
    result = db.table("event_websites").select("*").eq("slug", slug).eq("published", True).execute()
    if not result.data:
        raise ValueError("Website not found")
    website = result.data[0]

    event = db.table("events").select(
        "id, title, description, event_date, event_time, location"
    ).eq("id", website["event_id"]).execute()
    website["event"] = event.data[0] if event.data else None
    return website
