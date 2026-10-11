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


def _request(ip="203.0.113.9", forwarded=None):
    from starlette.requests import Request
    headers = [(b"x-forwarded-for", forwarded.encode())] if forwarded else []
    return Request({"type": "http", "headers": headers, "client": (ip, 1234)})


def test_require_admin_correct_secret():
    with patch("middleware.auth.settings") as mock_settings:
        mock_settings.admin_secret = "my-admin-secret"
        from middleware.auth import require_admin

        # Should not raise
        require_admin(_request(), x_admin_secret="my-admin-secret")


def test_require_admin_wrong_secret():
    with patch("middleware.auth.settings") as mock_settings:
        mock_settings.admin_secret = "my-admin-secret"
        from middleware.auth import require_admin

        with pytest.raises(HTTPException) as exc:
            require_admin(_request(), x_admin_secret="wrong-secret")
        assert exc.value.status_code == 403


def test_require_admin_disabled_when_secret_unset():
    """An unset ADMIN_SECRET must never match an empty header."""
    with patch("middleware.auth.settings") as mock_settings:
        mock_settings.admin_secret = ""
        from middleware.auth import require_admin

        with pytest.raises(HTTPException) as exc:
            require_admin(_request(), x_admin_secret="")
        assert exc.value.status_code == 503


def test_require_admin_locks_out_repeated_failures():
    with patch("middleware.auth.settings") as mock_settings:
        mock_settings.admin_secret = "my-admin-secret"
        from middleware.auth import require_admin

        for _ in range(10):
            with pytest.raises(HTTPException):
                require_admin(_request(), x_admin_secret="guess")
        with pytest.raises(HTTPException) as exc:
            require_admin(_request(), x_admin_secret="my-admin-secret")  # even the right one
        assert exc.value.status_code == 429
        # a different client is unaffected
        require_admin(_request(ip="198.51.100.7"), x_admin_secret="my-admin-secret")
