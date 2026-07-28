from datetime import datetime, timezone
import database
from middleware.logging import log_event as _log
from premium_websites.schemas import CreatePremiumSiteRequest, UpdatePremiumSiteRequest


def _get_owned(db, user_id: str, site_id: str) -> dict:
    result = (
        db.table("premium_websites").select("*").eq("id", site_id).eq("user_id", user_id).execute()
    )
    if not result.data:
        raise ValueError("Website not found")
    return result.data[0]


def create_premium_site(user_id: str, data: CreatePremiumSiteRequest) -> dict:
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
