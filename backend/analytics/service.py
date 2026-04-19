import database
from middleware.logging import log_event as _log


def _count(table: str, filters: dict | None = None) -> int:
    db = database.get_db()
    query = db.table(table).select("id", count="exact")
    if filters:
        for col, val in filters.items():
            query = query.eq(col, val)
    result = query.execute()
    return result.count or 0


def get_dashboard() -> dict:
    db = database.get_db()

    total_users = _count("users")
    total_events = _count("events")
    total_orders = _count("orders")
    pending_orders = _count("orders", {"status": "pending"})
    notifs_sent = _count("notifications", {"status": "sent"})
    notifs_failed = _count("notifications", {"status": "failed"})

    revenue_result = db.rpc("sum_revenue").execute()
    total_revenue = 0.0
    if revenue_result.data:
        total_revenue = float(revenue_result.data[0].get("sum", 0) or 0)

    _log("analytics", "admin.dashboard_viewed")
    return {
        "total_users": total_users,
        "total_events": total_events,
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "pending_orders": pending_orders,
        "notifications_sent": notifs_sent,
        "notifications_failed": notifs_failed,
    }


def get_recent_logs(limit: int = 100) -> list:
    db = database.get_db()
    return db.table("logs").select("*").order("created_at", desc=True).limit(limit).execute().data


def get_user_growth(days: int = 30) -> list:
    db = database.get_db()
    result = db.rpc("user_growth_by_day", {"days_back": days}).execute()
    return result.data or []


def get_order_stats(days: int = 30) -> list:
    db = database.get_db()
    result = db.rpc("order_stats_by_day", {"days_back": days}).execute()
    return result.data or []
