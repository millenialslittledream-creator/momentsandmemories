import pytest
from unittest.mock import patch
from jose import jwt
from datetime import datetime, timedelta, timezone


def make_token(user_id: str = "user-123", email: str = "test@test.com", secret: str = "test-secret") -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def test_get_current_user_valid_token():
    with patch("middleware.auth.settings") as mock_settings:
        mock_settings.jwt_secret = "test-secret"
        from middleware.auth import get_current_user
        from fastapi.security import HTTPAuthorizationCredentials

        token = make_token(secret="test-secret")
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        user = get_current_user(creds)
        assert user["sub"] == "user-123"
        assert user["email"] == "test@test.com"


def test_get_current_user_invalid_token():
    with patch("middleware.auth.settings") as mock_settings:
        mock_settings.jwt_secret = "test-secret"
        from middleware.auth import get_current_user
        from fastapi.security import HTTPAuthorizationCredentials
        from fastapi import HTTPException

        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="bad.token.here")
        with pytest.raises(HTTPException) as exc:
            get_current_user(creds)
        assert exc.value.status_code == 401


def test_get_current_user_expired_token():
    with patch("middleware.auth.settings") as mock_settings:
        mock_settings.jwt_secret = "test-secret"
        from middleware.auth import get_current_user
        from fastapi.security import HTTPAuthorizationCredentials
        from fastapi import HTTPException

        expired_payload = {
            "sub": "user-123",
            "email": "test@test.com",
            "exp": datetime.now(timezone.utc) - timedelta(minutes=1),  # already expired
        }
        expired_token = jwt.encode(expired_payload, "test-secret", algorithm="HS256")
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=expired_token)
        with pytest.raises(HTTPException) as exc:
            get_current_user(creds)
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
        from fastapi import HTTPException

        with pytest.raises(HTTPException) as exc:
            require_admin(x_admin_secret="wrong-secret")
        assert exc.value.status_code == 403
