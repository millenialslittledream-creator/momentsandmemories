import pytest
from unittest.mock import MagicMock, patch
from fastapi import BackgroundTasks


def test_send_email_notification(mock_db):
    mock_db.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": "notif-123", "status": "pending"}]
    )
    mock_db.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[{}])

    with patch("notifications.service.SendGridAPIClient") as mock_sg:
        mock_sg.return_value.send.return_value.status_code = 202

        from notifications.service import send_notification
        from notifications.schemas import SendNotificationRequest

        result = send_notification("user-123", SendNotificationRequest(
            user_id="user-123",
            type="email",
            title="You're invited!",
            body="Join us for a celebration.",
            recipient="guest@test.com",
        ))
        assert result["status"] == "sent"


def test_send_sms_notification(mock_db):
    mock_db.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": "notif-456", "status": "pending"}]
    )
    mock_db.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[{}])

    with patch("notifications.service.httpx.post") as mock_post,          patch("notifications.service.settings") as mock_settings:
        mock_settings.telnyx_api_key = "KEY123"
        mock_settings.telnyx_from_number = "+15550001111"
        mock_settings.telnyx_messaging_profile_id = "profile-1"
        mock_post.return_value = MagicMock(status_code=200, json=lambda: {"data": {"id": "msg-123"}})

        from notifications.service import send_notification
        from notifications.schemas import SendNotificationRequest

        result = send_notification("user-123", SendNotificationRequest(
            user_id="user-123",
            type="sms",
            title="Invite",
            body="You are invited! Visit: https://example.com",
            recipient="+1234567890",
        ))
        assert result["status"] == "sent"

        _, kwargs = mock_post.call_args
        assert kwargs["headers"]["Authorization"] == "Bearer KEY123"
        assert kwargs["json"] == {
            "from": "+15550001111",
            "to": "+1234567890",
            "text": "Invite: You are invited! Visit: https://example.com",
            "messaging_profile_id": "profile-1",
        }


def test_send_sms_marks_failed_when_telnyx_rejects(mock_db):
    mock_db.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": "notif-789", "status": "pending"}]
    )
    update = mock_db.table.return_value.update

    with patch("notifications.service.httpx.post") as mock_post:
        mock_post.return_value = MagicMock(status_code=422, text="invalid destination")

        from notifications.service import send_notification, SmsSendError
        from notifications.schemas import SendNotificationRequest

        with pytest.raises(SmsSendError):
            send_notification("user-123", SendNotificationRequest(
                user_id="user-123",
                type="sms",
                title="Invite",
                body="Hello",
                recipient="+1234567890",
            ))
        assert update.call_args[0][0]["status"] == "failed"


def test_bulk_sms_sends_one_message_per_recipient_with_phone():
    from notifications.service import _do_bulk_send
    from notifications.schemas import BulkRecipient

    with patch("notifications.service._send_sms") as mock_send:
        _do_bulk_send(
            [
                BulkRecipient(phone="+15551230001", name="Ann"),
                BulkRecipient(email="no-phone@test.com", name="Bo"),
                BulkRecipient(phone="+15551230002", name="Cy"),
            ],
            channel="sms",
            subject="Party",
            body="Hi {name}!",
        )
        assert [c.args for c in mock_send.call_args_list] == [
            ("+15551230001", "Party: Hi Ann!"),
            ("+15551230002", "Party: Hi Cy!"),
        ]


def test_bulk_sms_failure_does_not_stop_remaining_recipients():
    from notifications.service import _do_bulk_send, SmsSendError
    from notifications.schemas import BulkRecipient

    with patch("notifications.service._send_sms", side_effect=[SmsSendError("boom"), "id-2"]) as mock_send:
        _do_bulk_send(
            [BulkRecipient(phone="+15551230001", name="A"), BulkRecipient(phone="+15551230002", name="B")],
            channel="sms",
            subject="S",
            body="b",
        )
        assert mock_send.call_count == 2


def _owned_event(fake_db, owner="user-1"):
    fake_db.STORE["events"] = [{"id": "event-123", "user_id": owner}]


def test_bulk_send_email_from_event(fake_db):
    """bulk_send with event_id should auto-fetch invitees and queue delivery."""
    _owned_event(fake_db)
    fake_db.STORE["event_invitees"] = [
        {"id": "1", "event_id": "event-123", "email": "alice@test.com", "name": "Alice", "phone": None},
        {"id": "2", "event_id": "event-123", "email": "bob@test.com", "name": "Bob", "phone": None},
    ]
    from notifications.service import bulk_send

    result = bulk_send(
        user_id="user-1",
        event_id="event-123",
        recipients=None,
        channel="email",
        subject="You're invited!",
        body="Hi {name}, join us for the celebration!",
        background_tasks=BackgroundTasks(),
    )
    assert result["total"] == 2
    assert result["status"] == "processing"


def test_bulk_send_with_manual_recipients(fake_db):
    """bulk_send with explicit recipients list — no event lookup needed."""
    from notifications.service import bulk_send
    from notifications.schemas import BulkRecipient

    recipients = [
        BulkRecipient(email="x@test.com", name="Xavier"),
        BulkRecipient(email="y@test.com", name="Yara"),
        BulkRecipient(email="z@test.com", name="Zara"),
    ]
    result = bulk_send(
        user_id="user-1",
        event_id=None,
        recipients=recipients,
        channel="email",
        subject="Big news",
        body="Hello {name}!",
        background_tasks=BackgroundTasks(),
    )
    assert result["total"] == 3
    assert result["status"] == "processing"


def test_bulk_send_rejects_someone_elses_event(fake_db):
    _owned_event(fake_db, owner="owner")
    fake_db.STORE["event_invitees"] = [{"id": "1", "event_id": "event-123", "phone": "+15550001111", "name": "G"}]
    from notifications.service import bulk_send

    with pytest.raises(ValueError, match="Event not found"):
        bulk_send("intruder", "event-123", None, "sms", "s", "b", BackgroundTasks())


def test_bulk_send_caps_recipient_count(fake_db):
    from notifications.service import bulk_send, MAX_BULK_RECIPIENTS
    from notifications.schemas import BulkRecipient

    many = [BulkRecipient(phone=f"+1555{i:07d}") for i in range(MAX_BULK_RECIPIENTS + 1)]
    with pytest.raises(ValueError, match="Too many recipients"):
        bulk_send("user-1", None, many, "sms", "s", "b", BackgroundTasks())


def test_sms_destination_is_validated():
    from notifications.service import _send_sms, SmsSendError

    with patch("notifications.service.httpx.post") as post:
        for bad in ("5551234567", "+1555", "+15551234567; DROP", "+447700900123", "", "+999123456789"):
            with pytest.raises(SmsSendError):
                _send_sms(bad, "hi")
        post.assert_not_called()   # nothing reaches Telnyx (+44 blocked: only +1 is enabled by default)


def test_email_body_is_escaped_not_injected_as_html(fake_db):
    from notifications.service import _as_html
    assert _as_html("<a href='http://evil'>Verify</a>" + chr(10) + "line2") == "&lt;a href=&#x27;http://evil&#x27;&gt;Verify&lt;/a&gt;<br>line2"


def test_send_notification_attributes_to_caller_not_body_user_id(fake_db):
    from notifications.service import send_notification
    from notifications.schemas import SendNotificationRequest

    send_notification("real-caller", SendNotificationRequest(
        user_id="victim", type="whatsapp", title="t", body="b", recipient="+15550001111"))
    assert fake_db.STORE["notifications"][0]["user_id"] == "real-caller"
