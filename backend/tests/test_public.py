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
