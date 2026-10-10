import database
from middleware.logging import log_event as _log

VALID_RSVP_STATUSES = {"accepted", "declined", "maybe"}

DEFAULT_RSVP_CONFIG = {
    "enabled": True,
    "responseOptions": {"yes": True, "no": True, "maybe": True},
    "collectGuestCount": True,
    "collectKidsCount": True,
    # Missing config means an older event. Keep its previously-optional food
    # field compatible instead of suddenly requiring a meal for every guest.
    "collectFoodPreference": False,
    "foodOptions": ["Vegetarian", "Non-Vegetarian", "Vegan", "Kids Meal"],
    "collectAdditionalInfo": True,
    "childAgeCutoff": 12,
}


def normalize_rsvp_config(raw: dict | None) -> dict:
    raw = raw if isinstance(raw, dict) else {}
    response_options = raw.get("responseOptions")
    if not isinstance(response_options, dict):
        response_options = {}
    food_options = raw.get("foodOptions")
    if not isinstance(food_options, list) or not food_options:
        food_options = DEFAULT_RSVP_CONFIG["foodOptions"]
    cutoff = raw.get("childAgeCutoff", DEFAULT_RSVP_CONFIG["childAgeCutoff"])
    try:
        cutoff = max(1, min(int(cutoff), 21))
    except (TypeError, ValueError):
        cutoff = DEFAULT_RSVP_CONFIG["childAgeCutoff"]

    cleaned_options = [str(option).strip() for option in food_options if str(option).strip()]
    if not cleaned_options:
        cleaned_options = DEFAULT_RSVP_CONFIG["foodOptions"]

    return {
        **DEFAULT_RSVP_CONFIG,
        **raw,
        "responseOptions": {
            **DEFAULT_RSVP_CONFIG["responseOptions"],
            **response_options,
            # Every RSVP needs the two definitive answers. Hosts may choose
            # whether to offer the additional tentative option.
            "yes": True,
            "no": True,
        },
        "foodOptions": cleaned_options,
        "childAgeCutoff": cutoff,
    }


def get_public_event(event_id: str) -> dict:
    db = database.get_db()
    result = (
        db.table("events")
        .select("id,title,description,event_date,event_time,location,cover_image_url,rsvp_enabled,rsvp_config,status,template_id,form_data")
        .eq("id", event_id)
        .eq("status", "published")
        .execute()
    )
    if not result.data:
        raise ValueError("Event not found or not published")
    event = result.data[0]
    event["rsvp_config"] = normalize_rsvp_config(event.get("rsvp_config"))

    count_result = (
        db.table("event_invitees")
        .select("id", count="exact")
        .eq("event_id", event_id)
        .execute()
    )
    event["invitee_count"] = count_result.count or 0

    # Attach the latest design customization (font/colour/size/position overrides
    # + photo overlay) so the public page can re-render the exact designed
    # invitation. Read via the service-role client, so RLS is not in the way.
    cust = (
        db.table("evite_customizations")
        .select("template_id,field_overrides,photo_overlay")
        .eq("event_id", event_id)
        .order("updated_at", desc=True)
        .limit(1)
        .execute()
    )
    event["customization"] = cust.data[0] if cust.data else None
    return event


def get_public_website(slug: str) -> dict:
    from event_websites.service import get_public_website_by_slug
    return get_public_website_by_slug(slug)


def get_public_premium_site(slug: str) -> dict:
    from premium_websites.service import get_public_premium_site_by_slug
    return get_public_premium_site_by_slug(slug)


def get_public_book(event_id: str) -> dict:
    from invitation_books.service import get_public_book_for_event
    return get_public_book_for_event(event_id)


def get_invitee_for_rsvp(event_id: str, invitee_id: str) -> dict:
    db = database.get_db()
    result = (
        db.table("event_invitees")
        .select("id,name,email,rsvp_status,rsvp_message,dietary_requirements,party_size,kids_count,food_preference,meal_preferences")
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
    party_size: int | None = None,
    kids_count: int | None = None,
    food_preference: str | None = None,
    adults_count: int | None = None,
    children_count: int | None = None,
    meal_preferences: dict[str, int] | None = None,
) -> dict:
    if status not in VALID_RSVP_STATUSES:
        raise ValueError(f"Invalid RSVP status: {status!r}. Must be 'accepted', 'declined', or 'maybe'")

    db = database.get_db()
    event_result = (
        db.table("events")
        .select("id,title,user_id,status,rsvp_enabled,rsvp_config")
        .eq("id", event_id)
        .eq("status", "published")
        .execute()
    )
    if not event_result.data:
        raise ValueError("Event not found or not published")
    event = event_result.data[0]
    config = normalize_rsvp_config(event.get("rsvp_config"))
    if not event.get("rsvp_enabled", True) or not config.get("enabled", True):
        raise ValueError("RSVPs are closed for this event")

    status_key = {"accepted": "yes", "declined": "no", "maybe": "maybe"}[status]
    if not config["responseOptions"].get(status_key, False):
        raise ValueError("That RSVP response is not available for this event")

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
    update = {
        "rsvp_status": status,
        "rsvp_message": message,
        "dietary_requirements": dietary_requirements,
        "responded_at": datetime.now(timezone.utc).isoformat(),
    }

    if status == "accepted":
        # Prefer the explicit new adults/children fields. Fall back to the old
        # party-size API so existing invitation links remain usable.
        if adults_count is not None or children_count is not None:
            adults = adults_count if adults_count is not None else 1
            children = children_count if children_count is not None else 0
        else:
            legacy_total = party_size if party_size is not None else 1
            children = kids_count if kids_count is not None else 0
            adults = legacy_total - children

        if isinstance(adults, bool) or not isinstance(adults, int) or adults < 1:
            raise ValueError("At least one adult attendee is required")
        if isinstance(children, bool) or not isinstance(children, int) or children < 0:
            raise ValueError("Children count cannot be negative")
        if not config.get("collectKidsCount", True):
            children = 0

        total_people = adults + children
        cleaned_meals: dict[str, int] = {}
        for option, quantity in (meal_preferences or {}).items():
            if isinstance(quantity, bool) or not isinstance(quantity, int) or quantity < 0:
                raise ValueError("Meal quantities must be whole numbers of zero or more")
            if quantity > 0:
                cleaned_meals[str(option)] = quantity

        # Legacy clients selected a single meal for the party. Treat it as the
        # whole party only when a quantity map was not supplied.
        if not cleaned_meals and food_preference:
            cleaned_meals[food_preference] = total_people

        if config.get("collectFoodPreference", False):
            allowed = set(config.get("foodOptions") or [])
            unknown = [option for option in cleaned_meals if option not in allowed]
            if unknown:
                raise ValueError(f"Meal option is not available: {unknown[0]}")
            if sum(cleaned_meals.values()) != total_people:
                raise ValueError("Meal quantities must equal the total number of attendees")
        else:
            cleaned_meals = {}

        update.update({
            "party_size": total_people,
            "kids_count": children,
            "meal_preferences": cleaned_meals,
            # Retained for old dashboard/client compatibility.
            "food_preference": next(iter(cleaned_meals), None),
        })
    else:
        # A changed response must not leave old attending/meal totals behind.
        update.update({
            "dietary_requirements": "",
            "party_size": None,
            "kids_count": None,
            "food_preference": None,
            "meal_preferences": {},
        })

    db.table("event_invitees").update(update).eq("id", invitee_id).execute()

    _log(
        "public",
        "rsvp.submitted",
        user_id=event.get("user_id"),
        metadata={
            "event_id": event_id,
            "event_title": event.get("title"),
            "invitee_id": invitee_id,
            "status": status,
            "party_size": update.get("party_size"),
        },
    )
    return {
        "invitee_id": invitee_id,
        "status": status,
        "message": message,
        "party_size": update.get("party_size"),
        "kids_count": update.get("kids_count"),
        "meal_preferences": update.get("meal_preferences", {}),
    }
