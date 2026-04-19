import pytest
from unittest.mock import MagicMock


def test_get_profile_success(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{
            "id": "user-123",
            "email": "test@test.com",
            "first_name": "Test",
            "last_name": "User",
            "avatar_url": None,
            "created_at": "2026-01-01T00:00:00Z",
        }]
    )

    from users.service import get_profile
    result = get_profile("user-123")
    assert result["id"] == "user-123"
    assert result["email"] == "test@test.com"


def test_get_profile_not_found(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])

    from users.service import get_profile
    with pytest.raises(ValueError, match="not found"):
        get_profile("nonexistent-id")


def test_update_profile_success(mock_db):
    mock_db.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{
            "id": "user-123",
            "email": "test@test.com",
            "first_name": "Updated",
            "last_name": "Name",
            "avatar_url": None,
            "created_at": "2026-01-01T00:00:00Z",
        }]
    )

    from users.service import update_profile
    result = update_profile("user-123", {"first_name": "Updated", "last_name": "Name"})
    assert result["first_name"] == "Updated"


def test_update_profile_ignores_none_values(mock_db):
    mock_db.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "user-123", "email": "test@test.com", "first_name": "Test",
               "last_name": "User", "avatar_url": None, "created_at": "2026-01-01T00:00:00Z"}]
    )

    from users.service import update_profile
    update_profile("user-123", {"first_name": "Test", "last_name": None, "avatar_url": None})

    # Verify only non-None values were passed to DB update
    call_args = mock_db.table.return_value.update.call_args[0][0]
    assert "last_name" not in call_args
    assert "avatar_url" not in call_args
    assert call_args == {"first_name": "Test"}
