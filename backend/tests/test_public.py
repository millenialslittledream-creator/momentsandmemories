import pytest
from unittest.mock import MagicMock
from fastapi import HTTPException


def test_get_public_event_success(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "evt-1", "title": "Test Party", "status": "published",
               "event_date": "2026-08-01", "location": "NYC", "description": "Fun",
               "cover_image_url": None, "rsvp_enabled": True}]
    )
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[], count=5
    )
    from public.service import get_public_event
    result = get_public_event("evt-1")
    assert result["title"] == "Test Party"


def test_get_public_event_not_published(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
    from public.service import get_public_event
    with pytest.raises(ValueError, match="not found"):
        get_public_event("evt-1")


def test_submit_rsvp_accepted(mock_db):
    events = MagicMock()
    invitees = MagicMock()
    events.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[{
        "id": "evt-1", "title": "Dinner", "user_id": "host-1", "status": "published",
        "rsvp_enabled": True,
        "rsvp_config": {
            "collectFoodPreference": True,
            "foodOptions": ["Vegetarian", "Non-Vegetarian", "Kids Meal"],
        },
    }])
    invitees.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[{"id": "inv-1"}])
    invitees.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[{}])
    mock_db.table.side_effect = lambda name: events if name == "events" else invitees

    from public.service import submit_rsvp
    result = submit_rsvp(
        "evt-1", "inv-1", "accepted", "Looking forward!", "Nut allergy",
        adults_count=2,
        children_count=1,
        meal_preferences={"Vegetarian": 1, "Non-Vegetarian": 1, "Kids Meal": 1},
    )
    assert result["status"] == "accepted"
    assert result["party_size"] == 3
    assert result["kids_count"] == 1
    assert result["meal_preferences"]["Kids Meal"] == 1
    update = invitees.update.call_args.args[0]
    assert update["party_size"] == 3
    assert update["meal_preferences"] == {"Vegetarian": 1, "Non-Vegetarian": 1, "Kids Meal": 1}


def test_submit_rsvp_rejects_meal_total_mismatch(mock_db):
    events = MagicMock()
    invitees = MagicMock()
    events.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[{
        "id": "evt-1", "status": "published", "rsvp_enabled": True,
        "rsvp_config": {"collectFoodPreference": True, "foodOptions": ["Vegetarian"]},
    }])
    invitees.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[{"id": "inv-1"}])
    mock_db.table.side_effect = lambda name: events if name == "events" else invitees

    from public.service import submit_rsvp
    with pytest.raises(ValueError, match="Meal quantities must equal"):
        submit_rsvp(
            "evt-1", "inv-1", "accepted", "", "",
            adults_count=2, children_count=0, meal_preferences={"Vegetarian": 1},
        )
    invitees.update.assert_not_called()


def test_declined_update_clears_attendee_and_meal_totals(mock_db):
    events = MagicMock()
    invitees = MagicMock()
    events.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[{
        "id": "evt-1", "status": "published", "rsvp_enabled": True, "rsvp_config": {},
    }])
    invitees.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[{"id": "inv-1"}])
    invitees.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[{}])
    mock_db.table.side_effect = lambda name: events if name == "events" else invitees

    from public.service import submit_rsvp
    submit_rsvp("evt-1", "inv-1", "declined", "Sorry", "old note")
    update = invitees.update.call_args.args[0]
    assert update["party_size"] is None
    assert update["kids_count"] is None
    assert update["meal_preferences"] == {}
    assert update["dietary_requirements"] == ""


def test_submit_rsvp_invalid_status(mock_db):
    from public.service import submit_rsvp
    with pytest.raises(ValueError, match="Invalid RSVP status"):
        submit_rsvp("evt-1", "inv-1", "maybe_not", "", "")


@pytest.mark.parametrize("event_id", ["not-a-real-event", "", "1234"])
def test_public_route_rejects_malformed_event_id(event_id):
    from public.router import get_public_event

    with pytest.raises(HTTPException) as exc:
        get_public_event(event_id)

    assert exc.value.status_code == 404
    assert exc.value.detail == "Event not found"


def test_public_route_passes_normalized_uuid_to_service():
    from unittest.mock import patch
    from public.router import get_public_event

    event_id = "B33F7E21-2E89-4ED9-B5BF-9C44A8365E03"
    expected = "b33f7e21-2e89-4ed9-b5bf-9c44a8365e03"

    with patch("public.router.service.get_public_event", return_value={"id": expected}) as get_event:
        result = get_public_event(event_id)

    get_event.assert_called_once_with(expected)
    assert result == {"id": expected}
