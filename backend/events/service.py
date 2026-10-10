from datetime import datetime, timezone
import database
from middleware.logging import log_event as _log
from events.schemas import CreateEventRequest, UpdateEventRequest, InviteeIn


VALID_EVENT_STATUSES = {"draft", "published", "archived"}


def create_event(user_id: str, data: CreateEventRequest) -> dict:
    db = database.get_db()
    payload = {k: v for k, v in data.model_dump().items() if v is not None}
    payload["user_id"] = user_id
    # Honor the requested publish state (the create flow publishes the evite at
    # the Share step so its link works right away); default to a private draft.
    status = payload.get("status") or "draft"
    if status not in VALID_EVENT_STATUSES:
        raise ValueError(f"Invalid status: {status!r}")
    payload["status"] = status
    result = db.table("events").insert(payload).execute()
    event = result.data[0]
    _log("events", "event.created", user_id=user_id, metadata={"event_id": event["id"]})
    return event


def list_events(user_id: str, limit: int = 50, offset: int = 0) -> list:
    db = database.get_db()
    return (
        db.table("events")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .offset(offset)
        .execute().data
    )


def get_event(user_id: str, event_id: str) -> dict:
    db = database.get_db()
    result = db.table("events").select("*").eq("id", event_id).eq("user_id", user_id).execute()
    if not result.data:
        raise ValueError("Event not found")
    return result.data[0]


def update_event(user_id: str, event_id: str, data: UpdateEventRequest) -> dict:
    db = database.get_db()
    get_event(user_id, event_id)  # ownership check
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = db.table("events").update(updates).eq("id", event_id).execute()
    _log("events", "event.updated", user_id=user_id, metadata={"event_id": event_id})
    return result.data[0]


def delete_event(user_id: str, event_id: str) -> dict:
    db = database.get_db()
    get_event(user_id, event_id)  # ownership check — raises if not found
    db.table("events").delete().eq("id", event_id).execute()
    _log("events", "event.deleted", user_id=user_id, metadata={"event_id": event_id})
    return {"deleted": True}


def add_invitees(event_id: str, invitees: list) -> list:
    db = database.get_db()
    rows = [{k: v for k, v in inv.model_dump().items() if v is not None} for inv in invitees]
    for row in rows:
        row["event_id"] = event_id
    result = db.table("event_invitees").insert(rows).execute()
    _log("events", "invitees.added", metadata={"event_id": event_id, "count": len(rows)})
    return result.data


def list_invitees(event_id: str) -> list:
    db = database.get_db()
    return db.table("event_invitees").select("*").eq("event_id", event_id).execute().data


def remove_invitee(event_id: str, invitee_id: str) -> dict:
    db = database.get_db()
    db.table("event_invitees").delete().eq("id", invitee_id).eq("event_id", event_id).execute()
    _log("events", "invitee.removed", metadata={"invitee_id": invitee_id})
    return {"deleted": True}


def _build_rsvp_stats(rows: list[dict], include_guests: bool = True) -> dict:
    def status_of(r):
        return r.get("rsvp_status") or "pending"

    total = len(rows)
    accepted = sum(1 for r in rows if status_of(r) == "accepted")
    declined = sum(1 for r in rows if status_of(r) == "declined")
    maybe = sum(1 for r in rows if status_of(r) == "maybe")
    pending = sum(1 for r in rows if status_of(r) == "pending")

    responded = accepted + declined + maybe

    # Quantity-based meal tallies for attending guests. Older rows that only
    # have food_preference retain the previous one-response-equals-one count.
    food_preferences: dict = {}
    for r in rows:
        if status_of(r) != "accepted":
            continue
        meals = r.get("meal_preferences")
        if isinstance(meals, dict) and meals:
            for option, quantity in meals.items():
                if isinstance(quantity, int) and not isinstance(quantity, bool) and quantity > 0:
                    food_preferences[option] = food_preferences.get(option, 0) + quantity
        else:
            fp = (r.get("food_preference") or "").strip()
            if fp:
                food_preferences[fp] = food_preferences.get(fp, 0) + 1

    # Head-count + party-size buckets for attending guests.
    adults = 0
    kids = 0
    group_sizes = {"1": 0, "2": 0, "3-4": 0, "5+": 0}
    for r in rows:
        if status_of(r) != "accepted":
            continue
        ps = r.get("party_size")
        kc = r.get("kids_count") or 0
        if ps is None:
            ps = 1
        adults += max(ps - kc, 0)
        kids += kc
        if ps <= 1:
            group_sizes["1"] += 1
        elif ps == 2:
            group_sizes["2"] += 1
        elif ps <= 4:
            group_sizes["3-4"] += 1
        else:
            group_sizes["5+"] += 1

    guests = [
        {
            "name": r.get("name"),
            "email": r.get("email"),
            "phone": r.get("phone"),
            "status": status_of(r),
            "party_size": r.get("party_size"),
            "kids_count": r.get("kids_count"),
            "food_preference": r.get("food_preference"),
            "meal_preferences": r.get("meal_preferences") or {},
            "dietary_requirements": r.get("dietary_requirements"),
            "responded_at": r.get("responded_at"),
        }
        for r in rows
    ]

    return {
        # Backward-compatible core keys (EngagementPanel still reads these).
        "total": total,
        "accepted": accepted,
        "declined": declined,
        "pending": pending,
        "responded": responded,
        "response_rate": round((responded / total) * 100) if total else 0,
        # Extended analytics.
        "maybe": maybe,
        "adults": adults,
        "kids": kids,
        "total_people": adults + kids,
        "food_preferences": food_preferences,
        "group_sizes": group_sizes,
        "guests": guests if include_guests else [],
    }


def get_rsvp_stats(user_id: str, event_id: str) -> dict:
    db = database.get_db()
    event = db.table("events").select("id").eq("id", event_id).eq("user_id", user_id).execute()
    if not event.data:
        raise ValueError("Event not found")
    rows = (
        db.table("event_invitees")
        .select("name,email,phone,rsvp_status,dietary_requirements,party_size,kids_count,food_preference,meal_preferences,responded_at")
        .eq("event_id", event_id)
        .execute()
        .data
    )
    return _build_rsvp_stats(rows)


def get_overall_rsvp_summary(user_id: str) -> dict:
    db = database.get_db()
    events = (
        db.table("events")
        .select("id,title,event_date,status")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
        .data
    )
    event_ids = [event["id"] for event in events]
    rows: list[dict] = []
    if event_ids:
        rows = (
            db.table("event_invitees")
            .select("event_id,name,email,phone,rsvp_status,dietary_requirements,party_size,kids_count,food_preference,meal_preferences,responded_at")
            .in_("event_id", event_ids)
            .execute()
            .data
        )

    totals = _build_rsvp_stats(rows, include_guests=False)
    totals["total_events"] = len(events)

    rows_by_event: dict[str, list[dict]] = {event_id: [] for event_id in event_ids}
    for row in rows:
        if row.get("event_id") in rows_by_event:
            rows_by_event[row["event_id"]].append(row)

    event_summaries = []
    for event in events:
        stats = _build_rsvp_stats(rows_by_event[event["id"]], include_guests=False)
        event_summaries.append({
            "event_id": event["id"],
            "event_title": event.get("title") or "Untitled event",
            "event_date": event.get("event_date"),
            "status": event.get("status"),
            **stats,
        })

    return {"totals": totals, "events": event_summaries}
