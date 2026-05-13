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


def test_add_invitees(mock_db):
    mock_db.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[
            {"id": "inv-1", "event_id": "event-123", "email": "guest@test.com", "name": "Guest"},
        ]
    )

    from events.service import add_invitees
    from events.schemas import InviteeIn

    result = add_invitees("event-123", [InviteeIn(email="guest@test.com", name="Guest")])
    assert len(result) == 1
    assert result[0]["email"] == "guest@test.com"


def test_list_invitees(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "inv-1"}, {"id": "inv-2"}]
    )

    from events.service import list_invitees
    result = list_invitees("event-123")
    assert len(result) == 2


def test_remove_invitee(mock_db):
    mock_db.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )

    from events.service import remove_invitee
    result = remove_invitee("event-123", "inv-1")
    assert result["deleted"] is True
