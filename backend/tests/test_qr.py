import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta, timezone


def test_create_qr_session(mock_db):
    mock_db.table.return_value.insert.return_value.execute.return_value = MagicMock(data=[{}])

    with patch("qr.service.settings") as mock_settings:
        mock_settings.frontend_url = "http://localhost:5173"

        from qr.service import create_qr_session
        result = create_qr_session("user-123", event_id=None)

        assert "session_token" in result
        assert "qr_code_base64" in result
        # PNG base64 starts with iVBOR
        assert result["qr_code_base64"].startswith("iVBOR")
        assert result["expires_in_seconds"] == 900


def test_submit_contacts_valid_session(mock_db):
    future = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{
            "id": "session-123",
            "session_token": "abc123",
            "status": "pending",
            "expires_at": future,
        }]
    )
    mock_db.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[{}])

    from qr.service import submit_contacts
    result = submit_contacts("abc123", [{"name": "John", "email": "john@test.com", "phone": "+1234567890"}])
    assert result["status"] == "completed"
    assert result["count"] == 1


def test_submit_contacts_expired_session(mock_db):
    past = (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{
            "id": "session-123",
            "status": "pending",
            "expires_at": past,
        }]
    )
    mock_db.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[{}])

    from qr.service import submit_contacts
    with pytest.raises(ValueError, match="expired"):
        submit_contacts("abc123", [])


def test_submit_contacts_session_not_found(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])

    from qr.service import submit_contacts
    with pytest.raises(ValueError, match="not found"):
        submit_contacts("badtoken", [])


def test_get_session_status(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"session_token": "abc123", "status": "completed", "contacts_json": [{"name": "John"}]}]
    )

    from qr.service import get_session_status
    result = get_session_status("abc123")
    assert result["status"] == "completed"
    assert len(result["contacts_json"]) == 1
