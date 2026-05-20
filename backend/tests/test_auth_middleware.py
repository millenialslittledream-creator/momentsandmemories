import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials


def test_get_current_user_valid_token(mock_db):
    mock_db.auth.get_user.return_value = MagicMock(
        user=MagicMock(id="user-123", email="test@test.com")
    )

    from middleware.auth import get_current_user

    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="valid-supabase-token")
    user = get_current_user(creds)
    assert user["sub"] == "user-123"
    assert user["email"] == "test@test.com"


def test_get_current_user_invalid_token(mock_db):
    mock_db.auth.get_user.side_effect = Exception("Invalid token")

    from middleware.auth import get_current_user

    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="bad.token.here")
    with pytest.raises(HTTPException) as exc:
        get_current_user(creds)
    assert exc.value.status_code == 401


def test_get_current_user_expired_token(mock_db):
    mock_db.auth.get_user.return_value = MagicMock(user=None)

    from middleware.auth import get_current_user

    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="expired-token")
    with pytest.raises(HTTPException) as exc:
        get_current_user(creds)
    assert exc.value.status_code == 401


def test_get_current_user_no_credentials():
    from middleware.auth import get_current_user

    with pytest.raises(HTTPException) as exc:
        get_current_user(None)
    assert exc.value.status_code == 401


def test_require_admin_correct_secret():
    with patch("middleware.auth.settings") as mock_settings:
        mock_settings.admin_secret = "my-admin-secret"
        from middleware.auth import require_admin

        # Should not raise
        require_admin(x_admin_secret="my-admin-secret")


def test_require_admin_wrong_secret():
    with patch("middleware.auth.settings") as mock_settings:
        mock_settings.admin_secret = "my-admin-secret"
        from middleware.auth import require_admin

        with pytest.raises(HTTPException) as exc:
            require_admin(x_admin_secret="wrong-secret")
        assert exc.value.status_code == 403
