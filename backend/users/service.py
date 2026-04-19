import database
from middleware.logging import log_event


def get_profile(user_id: str) -> dict:
    db = database.get_db()
    result = db.table("users").select(
        "id, email, first_name, last_name, avatar_url, created_at"
    ).eq("id", user_id).execute()
    if not result.data:
        raise ValueError("User not found")
    return result.data[0]


def update_profile(user_id: str, updates: dict) -> dict:
    db = database.get_db()
    filtered = {k: v for k, v in updates.items() if v is not None}
    result = db.table("users").update(filtered).eq("id", user_id).execute()
    log_event("users", "user.profile_updated", user_id=user_id)
    return result.data[0]
