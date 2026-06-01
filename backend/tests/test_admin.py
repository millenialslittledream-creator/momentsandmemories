import pytest
from unittest.mock import MagicMock


def test_list_users(mock_db):
    mock_db.table.return_value.select.return_value.order.return_value.limit.return_value.offset.return_value.execute.return_value = MagicMock(
        data=[{"id": "u1", "email": "a@b.com", "created_at": "2026-01-01"}]
    )
    from admin.service import list_users
    result = list_users()
    assert len(result) == 1
    assert result[0]["email"] == "a@b.com"


def test_list_all_events(mock_db):
    mock_db.table.return_value.select.return_value.order.return_value.limit.return_value.offset.return_value.execute.return_value = MagicMock(
        data=[{"id": "e1", "title": "Party", "status": "published", "user_id": "u1", "created_at": "2026-01-01", "event_date": "2026-08-01"}]
    )
    from admin.service import list_all_events
    result = list_all_events()
    assert result[0]["title"] == "Party"


def test_delete_user(mock_db):
    mock_db.table.return_value.delete.return_value.eq.return_value.execute.return_value = MagicMock(data=[{}])
    from admin.service import delete_user
    result = delete_user("u1")
    assert result["deleted"] is True


def test_moderate_event(mock_db):
    mock_db.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[{}])
    from admin.service import moderate_event
    result = moderate_event("e1", "archived")
    assert result["status"] == "archived"


def test_moderate_event_invalid_status(mock_db):
    from admin.service import moderate_event
    with pytest.raises(ValueError, match="Invalid status"):
        moderate_event("e1", "banned")
