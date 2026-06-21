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

        result = send_notification(SendNotificationRequest(
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

    with patch("notifications.service.boto3") as mock_boto3:
        mock_boto3.client.return_value.send_text_message.return_value = {"MessageId": "msg-123"}

        from notifications.service import send_notification
        from notifications.schemas import SendNotificationRequest

        result = send_notification(SendNotificationRequest(
            user_id="user-123",
            type="sms",
            title="Invite",
            body="You are invited! Visit: https://example.com",
            recipient="+1234567890",
        ))
        assert result["status"] == "sent"


def test_bulk_send_email_from_event(mock_db):
    """bulk_send with event_id should auto-fetch invitees and queue delivery."""
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[
            {"email": "alice@test.com", "name": "Alice", "phone": None},
            {"email": "bob@test.com", "name": "Bob", "phone": None},
        ]
    )

    with patch("notifications.service.boto3") as mock_boto3:
        mock_boto3.client.return_value = MagicMock()

        from notifications.service import bulk_send

        bg = BackgroundTasks()
        result = bulk_send(
            event_id="event-123",
            recipients=None,
            channel="email",
            subject="You're invited!",
            body="Hi {name}, join us for the celebration!",
            background_tasks=bg,
        )
        assert result["total"] == 2
        assert result["status"] == "processing"


def test_bulk_send_with_manual_recipients():
    """bulk_send with explicit recipients list — no DB call needed."""
    with patch("notifications.service.boto3") as mock_boto3:
        mock_boto3.client.return_value = MagicMock()

        from notifications.service import bulk_send
        from notifications.schemas import BulkRecipient

        recipients = [
            BulkRecipient(email="x@test.com", name="Xavier"),
            BulkRecipient(email="y@test.com", name="Yara"),
            BulkRecipient(email="z@test.com", name="Zara"),
        ]
        bg = BackgroundTasks()
        result = bulk_send(
            event_id=None,
            recipients=recipients,
            channel="email",
            subject="Big news",
            body="Hello {name}!",
            background_tasks=bg,
        )
        assert result["total"] == 3
        assert result["status"] == "processing"
