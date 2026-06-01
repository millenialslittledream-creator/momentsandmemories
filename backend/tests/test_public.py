import pytest
from unittest.mock import MagicMock


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
    # check query
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "inv-1"}]
    )
    mock_db.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[{}])

    from public.service import submit_rsvp
    result = submit_rsvp("evt-1", "inv-1", "accepted", "Looking forward!", "Vegan")
    assert result["status"] == "accepted"


def test_submit_rsvp_invalid_status(mock_db):
    from public.service import submit_rsvp
    with pytest.raises(ValueError, match="Invalid RSVP status"):
        submit_rsvp("evt-1", "inv-1", "maybe_not", "", "")
