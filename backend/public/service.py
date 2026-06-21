import database
from middleware.logging import log_event as _log

VALID_RSVP_STATUSES = {"accepted", "declined"}


def get_public_event(event_id: str) -> dict:
    db = database.get_db()
    result = (
        db.table("events")
        .select("id,title,description,event_date,event_time,location,cover_image_url,rsvp_enabled,status")
        .eq("id", event_id)
        .eq("status", "published")
        .execute()
    )
    if not result.data:
        raise ValueError("Event not found or not published")
    event = result.data[0]

    count_result = (
        db.table("event_invitees")
        .select("id", count="exact")
        .eq("event_id", event_id)
        .execute()
    )
    event["invitee_count"] = count_result.count or 0
    return event


def get_public_website(slug: str) -> dict:
    from event_websites.service import get_public_website_by_slug
    return get_public_website_by_slug(slug)


def get_public_book(event_id: str) -> dict:
    from invitation_books.service import get_public_book_for_event
    return get_public_book_for_event(event_id)


def get_invitee_for_rsvp(event_id: str, invitee_id: str) -> dict:
    db = database.get_db()
    result = (
        db.table("event_invitees")
        .select("id,name,email,rsvp_status,rsvp_message,dietary_requirements")
        .eq("id", invitee_id)
        .eq("event_id", event_id)
        .execute()
    )
    if not result.data:
        raise ValueError("Invitee not found")
    return result.data[0]


def submit_rsvp(
    event_id: str,
    invitee_id: str,
    status: str,
    message: str,
    dietary_requirements: str,
) -> dict:
    if status not in VALID_RSVP_STATUSES:
        raise ValueError(f"Invalid RSVP status: {status!r}. Must be 'accepted' or 'declined'")

    db = database.get_db()
    check = (
        db.table("event_invitees")
        .select("id")
        .eq("id", invitee_id)
        .eq("event_id", event_id)
        .execute()
    )
    if not check.data:
        raise ValueError("Invitee not found for this event")

    from datetime import datetime, timezone
    db.table("event_invitees").update({
        "rsvp_status": status,
        "rsvp_message": message,
        "dietary_requirements": dietary_requirements,
        "responded_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", invitee_id).execute()

    _log("public", "rsvp.submitted", metadata={"event_id": event_id, "status": status})
    return {"invitee_id": invitee_id, "status": status, "message": message}
