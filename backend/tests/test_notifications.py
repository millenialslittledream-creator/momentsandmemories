import pytest
from unittest.mock import MagicMock, patch


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

    with patch("notifications.service.Client") as mock_twilio:
        mock_twilio.return_value.messages.create.return_value.sid = "SM123"

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
