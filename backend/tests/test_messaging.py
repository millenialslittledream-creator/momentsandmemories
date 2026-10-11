import pytest
from unittest.mock import MagicMock


def _event(fake_db, owner="u1", status="published"):
    fake_db.STORE["events"] = [{"id": "evt-1", "user_id": owner, "status": status}]


def test_send_organiser_message(fake_db):
    _event(fake_db)
    from messaging.service import send_organiser_message
    result = send_organiser_message("u1", "evt-1", "Alice", "Hello!")
    assert result["body"] == "Hello!"
    assert result["sender_type"] == "organiser"


def test_list_messages(fake_db):
    _event(fake_db)
    fake_db.STORE["event_messages"] = [
        {"id": "msg-1", "event_id": "evt-1", "body": "Hi", "sender_type": "organiser", "created_at": "1"},
        {"id": "msg-2", "event_id": "evt-1", "body": "Hey back", "sender_type": "guest", "created_at": "2"},
    ]
    from messaging.service import list_messages
    assert len(list_messages("u1", "evt-1")) == 2


def test_send_empty_message_raises(fake_db):
    _event(fake_db)
    from messaging.service import send_organiser_message
    with pytest.raises(ValueError, match="empty"):
        send_organiser_message("u1", "evt-1", "Alice", "   ")


def test_organiser_endpoints_require_event_ownership(fake_db):
    _event(fake_db, owner="owner")
    from messaging.service import list_messages, send_organiser_message
    with pytest.raises(ValueError):
        list_messages("intruder", "evt-1")
    with pytest.raises(ValueError):
        send_organiser_message("intruder", "evt-1", "Owner (host)", "pay me")


def test_guest_message_requires_real_invitee_of_published_event(fake_db):
    _event(fake_db)
    fake_db.STORE["event_invitees"] = [{"id": "inv-1", "event_id": "evt-1", "name": "Gus"}]
    from messaging.service import send_guest_message
    msg = send_guest_message("evt-1", "inv-1", "", "See you there")
    assert msg["sender_type"] == "guest" and msg["sender_name"] == "Gus"
    with pytest.raises(ValueError):
        send_guest_message("evt-1", "not-an-invitee", "", "spam")
    _event(fake_db, status="draft")
    with pytest.raises(ValueError):
        send_guest_message("evt-1", "inv-1", "", "spam")
