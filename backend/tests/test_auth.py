import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta, timezone


def test_signup_new_user(mock_db):
    # select returns empty (user doesn't exist yet)
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
    # insert returns new user
    mock_db.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": "user-123", "email": "test@test.com"}]
    )

    from auth.service import signup
    from auth.schemas import SignupRequest

    result = signup(SignupRequest(
        email="test@test.com",
        password="password123",
        first_name="Test",
        last_name="User",
    ))
    assert result["user_id"] == "user-123"
    assert "message" in result


def test_signup_duplicate_email(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "existing-user"}]
    )

    from auth.service import signup
    from auth.schemas import SignupRequest

    with pytest.raises(ValueError, match="already registered"):
        signup(SignupRequest(
            email="existing@test.com",
            password="password123",
            first_name="Test",
            last_name="User",
        ))


def test_login_valid_credentials(mock_db):
    import bcrypt as _bcrypt
    hashed = _bcrypt.hashpw("password123".encode(), _bcrypt.gensalt()).decode()

    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{
            "id": "user-123",
            "email": "test@test.com",
            "password_hash": hashed,
            "email_verified": True,
        }]
    )

    with patch("auth.service.settings") as mock_settings:
        mock_settings.jwt_secret = "test-secret"
        mock_settings.jwt_expire_minutes = 60

        from auth.service import login
        from auth.schemas import LoginRequest

        result = login(LoginRequest(email="test@test.com", password="password123"))
        assert "access_token" in result
        assert result["email"] == "test@test.com"
        assert result["user_id"] == "user-123"


def test_login_wrong_password(mock_db):
    import bcrypt as _bcrypt

    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{
            "id": "user-123",
            "email": "test@test.com",
            "password_hash": _bcrypt.hashpw("correct-password".encode(), _bcrypt.gensalt()).decode(),
            "email_verified": True,
        }]
    )

    from auth.service import login
    from auth.schemas import LoginRequest

    with pytest.raises(ValueError, match="Invalid credentials"):
        login(LoginRequest(email="test@test.com", password="wrong-password"))


def test_login_unverified_email(mock_db):
    import bcrypt as _bcrypt
    hashed = _bcrypt.hashpw("password123".encode(), _bcrypt.gensalt()).decode()

    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{
            "id": "user-123",
            "email": "test@test.com",
            "password_hash": hashed,
            "email_verified": False,
        }]
    )

    from auth.service import login
    from auth.schemas import LoginRequest

    with pytest.raises(ValueError, match="not verified"):
        login(LoginRequest(email="test@test.com", password="password123"))


def test_verify_otp_success(mock_db):
    future = (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{
            "id": "user-123",
            "email": "test@test.com",
            "otp_code": "123456",
            "otp_expires_at": future,
            "otp_attempts": 0,
        }]
    )
    mock_db.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[{}])

    with patch("auth.service.settings") as mock_settings:
        mock_settings.jwt_secret = "test-secret"
        mock_settings.jwt_expire_minutes = 60

        from auth.service import verify_otp
        result = verify_otp("test@test.com", "123456")
        assert "access_token" in result


def test_verify_otp_wrong_code(mock_db):
    future = (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{
            "id": "user-123",
            "otp_code": "123456",
            "otp_expires_at": future,
            "otp_attempts": 0,
        }]
    )
    mock_db.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[{}])

    from auth.service import verify_otp

    with pytest.raises(ValueError, match="Invalid OTP"):
        verify_otp("test@test.com", "999999")


def test_forgot_password_existing_user(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "user-123"}]
    )
    mock_db.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[{}])

    from auth.service import forgot_password
    result = forgot_password("test@test.com")
    assert "message" in result
    assert "reset_token" in result


def test_forgot_password_nonexistent_user(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])

    from auth.service import forgot_password
    result = forgot_password("nobody@test.com")
    assert "message" in result
    # No reset_token returned for non-existent user (security: don't reveal user existence)
    assert "reset_token" not in result
