import pytest
from unittest.mock import MagicMock


def test_create_event(mock_db):
    mock_db.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[{
            "id": "event-123",
            "user_id": "user-123",
            "title": "My Birthday",
            "event_date": "2026-06-15",
            "status": "draft",
            "created_at": "2026-04-19T00:00:00Z",
            "updated_at": "2026-04-19T00:00:00Z",
        }]
    )

    from events.service import create_event
    from events.schemas import CreateEventRequest

    result = create_event("user-123", CreateEventRequest(
        title="My Birthday",
        event_date="2026-06-15",
    ))
    assert result["id"] == "event-123"
    assert result["title"] == "My Birthday"


def test_list_events(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.offset.return_value.execute.return_value = MagicMock(
        data=[{"id": "event-1"}, {"id": "event-2"}]
    )

    from events.service import list_events
    result = list_events("user-123")
    assert len(result) == 2


def test_get_event_success(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "event-123", "user_id": "user-123", "title": "My Party"}]
    )

    from events.service import get_event
    result = get_event("user-123", "event-123")
    assert result["id"] == "event-123"


def test_get_event_not_found(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )

    from events.service import get_event
    with pytest.raises(ValueError, match="not found"):
        get_event("user-123", "nonexistent")


def test_delete_event_not_owner(mock_db):
    # get_event will raise ValueError because event not found
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )

    from events.service import delete_event
    with pytest.raises(ValueError, match="not found"):
        delete_event("user-123", "event-999")


def _own_event(fake_db, user_id="user-1"):
    fake_db.STORE["events"] = [{"id": "event-123", "user_id": user_id, "title": "T", "status": "draft"}]


def test_add_invitees(fake_db):
    _own_event(fake_db)
    from events.service import add_invitees
    from events.schemas import InviteeIn

    result = add_invitees("user-1", "event-123", [InviteeIn(email="guest@test.com", name="Guest")])
    assert len(result) == 1
    assert result[0]["email"] == "guest@test.com"


def test_list_invitees(fake_db):
    _own_event(fake_db)
    fake_db.STORE["event_invitees"] = [
        {"id": "inv-1", "event_id": "event-123"}, {"id": "inv-2", "event_id": "event-123"},
    ]
    from events.service import list_invitees
    assert len(list_invitees("user-1", "event-123")) == 2


def test_remove_invitee(fake_db):
    _own_event(fake_db)
    fake_db.STORE["event_invitees"] = [{"id": "inv-1", "event_id": "event-123"}]
    from events.service import remove_invitee
    assert remove_invitee("user-1", "event-123", "inv-1")["deleted"] is True
    assert fake_db.STORE["event_invitees"] == []


def test_invitee_operations_require_event_ownership(fake_db):
    _own_event(fake_db, user_id="owner")
    fake_db.STORE["event_invitees"] = [{"id": "inv-1", "event_id": "event-123"}]
    from events.service import add_invitees, list_invitees, remove_invitee
    from events.schemas import InviteeIn

    with pytest.raises(ValueError):
        list_invitees("someone-else", "event-123")
    with pytest.raises(ValueError):
        add_invitees("someone-else", "event-123", [InviteeIn(name="x")])
    with pytest.raises(ValueError):
        remove_invitee("someone-else", "event-123", "inv-1")
    assert len(fake_db.STORE["event_invitees"]) == 1


def test_rsvp_stats_count_people_and_each_meal_quantity():
    from events.service import _build_rsvp_stats

    stats = _build_rsvp_stats([
        {
            "name": "Asha",
            "rsvp_status": "accepted",
            "party_size": 3,
            "kids_count": 1,
            "meal_preferences": {"Vegetarian": 2, "Kids Meal": 1},
            "dietary_requirements": "One gluten-free meal",
        },
        {
            "name": "Ravi",
            "rsvp_status": "accepted",
            "party_size": 2,
            "kids_count": 0,
            "meal_preferences": {"Non-Vegetarian": 2},
        },
        {"name": "Mina", "rsvp_status": "declined"},
        {"name": "No reply", "rsvp_status": "pending"},
    ])

    assert stats["total"] == 4
    assert stats["responded"] == 3
    assert stats["response_rate"] == 75
    assert stats["adults"] == 4
    assert stats["kids"] == 1
    assert stats["total_people"] == 5
    assert stats["food_preferences"] == {"Vegetarian": 2, "Kids Meal": 1, "Non-Vegetarian": 2}
    assert stats["guests"][0]["dietary_requirements"] == "One gluten-free meal"
