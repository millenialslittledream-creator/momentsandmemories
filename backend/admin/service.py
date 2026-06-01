import database
from middleware.logging import log_event as _log


def list_users(limit: int = 100, offset: int = 0) -> list:
    db = database.get_db()
    return (
        db.table("users")
        .select("id,email,created_at")
        .order("created_at", desc=True)
        .limit(limit)
        .offset(offset)
        .execute().data
    )


def list_all_events(limit: int = 100, offset: int = 0) -> list:
    db = database.get_db()
    return (
        db.table("events")
        .select("id,title,status,user_id,created_at,event_date")
        .order("created_at", desc=True)
        .limit(limit)
        .offset(offset)
        .execute().data
    )


def delete_user(user_id: str) -> dict:
    db = database.get_db()
    db.table("users").delete().eq("id", user_id).execute()
    _log("admin", "user.deleted", metadata={"user_id": user_id})
    return {"deleted": True}


def moderate_event(event_id: str, status: str) -> dict:
    if status not in {"archived", "published", "draft"}:
        raise ValueError(f"Invalid status: {status!r}")
    db = database.get_db()
    db.table("events").update({"status": status}).eq("id", event_id).execute()
    _log("admin", "event.moderated", metadata={"event_id": event_id, "status": status})
    return {"event_id": event_id, "status": status}


def get_platform_stats() -> dict:
    from analytics.service import get_dashboard
    return get_dashboard()


def get_user_profile(user_id: str) -> dict:
    db = database.get_db()
    user_result = db.table("users").select("id,email,created_at").eq("id", user_id).execute()
    if not user_result.data:
        raise ValueError("User not found")
    user = user_result.data[0]

    events = (
        db.table("events")
        .select("id,title,status,event_date,location,created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute().data
    )
    orders = (
        db.table("orders")
        .select("id,status,total_amount,created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute().data
    )
    return {"user": user, "events": events, "orders": orders}


# ── Shop management ──────────────────────────────────────────────────────────

def list_all_shop_items() -> list:
    db = database.get_db()
    return (
        db.table("shop_items")
        .select("*")
        .order("created_at", desc=True)
        .execute().data
    )


def create_shop_item(data: dict) -> dict:
    db = database.get_db()
    result = db.table("shop_items").insert(data).execute()
    _log("admin", "shop_item.created", metadata={"name": data.get("name")})
    return result.data[0]


def update_shop_item(item_id: str, data: dict) -> dict:
    db = database.get_db()
    from datetime import datetime, timezone
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = db.table("shop_items").update(data).eq("id", item_id).execute()
    if not result.data:
        raise ValueError("Item not found")
    _log("admin", "shop_item.updated", metadata={"item_id": item_id})
    return result.data[0]


def delete_shop_item(item_id: str) -> dict:
    db = database.get_db()
    db.table("shop_items").update({"is_active": False}).eq("id", item_id).execute()
    _log("admin", "shop_item.deactivated", metadata={"item_id": item_id})
    return {"deleted": True}
