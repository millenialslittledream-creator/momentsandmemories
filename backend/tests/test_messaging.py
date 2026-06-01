import pytest
from unittest.mock import MagicMock


def test_send_organiser_message(mock_db):
    mock_db.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": "msg-1", "event_id": "evt-1", "sender_id": "u1",
               "sender_type": "organiser", "sender_name": "Alice",
               "body": "Hello!", "created_at": "2026-01-01"}]
    )
    from messaging.service import send_message
    result = send_message("evt-1", "u1", "organiser", "Alice", "Hello!")
    assert result["body"] == "Hello!"
    assert result["sender_type"] == "organiser"


def test_list_messages(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.offset.return_value.execute.return_value = MagicMock(
        data=[
            {"id": "msg-1", "body": "Hi", "sender_type": "organiser"},
            {"id": "msg-2", "body": "Hey back", "sender_type": "guest"},
        ]
    )
    from messaging.service import list_messages
    result = list_messages("evt-1")
    assert len(result) == 2


def test_send_empty_message_raises(mock_db):
    from messaging.service import send_message
    with pytest.raises(ValueError, match="empty"):
        send_message("evt-1", "u1", "organiser", "Alice", "   ")
