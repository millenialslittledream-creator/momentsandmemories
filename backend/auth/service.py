import secrets
from datetime import datetime, timedelta, timezone
from jose import jwt
import bcrypt as _bcrypt
import database
from config import settings
from middleware.logging import log_event
from auth.schemas import SignupRequest, LoginRequest


def _hash(password: str) -> str:
    return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()


def _verify(password: str, hashed: str) -> bool:
    return _bcrypt.checkpw(password.encode(), hashed.encode())


def _make_token(user_id: str, email: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    return jwt.encode({"sub": user_id, "email": email, "exp": exp}, settings.jwt_secret, algorithm="HS256")


def signup(data: SignupRequest) -> dict:
    db = database.get_db()
    existing = db.table("users").select("id").eq("email", data.email).execute()
    if existing.data:
        raise ValueError("Email already registered")

    otp = str(secrets.randbelow(900000) + 100000)
    otp_expires = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()

    result = db.table("users").insert({
        "email": data.email,
        "password_hash": _hash(data.password),
        "first_name": data.first_name,
        "last_name": data.last_name,
        "otp_code": otp,
        "otp_expires_at": otp_expires,
        "email_verified": False,
    }).execute()

    user = result.data[0]
    log_event("auth", "user.signup", user_id=str(user["id"]), metadata={"email": data.email})
    return {"user_id": str(user["id"]), "message": "OTP sent to email", "otp": otp}


def verify_otp(email: str, otp_code: str) -> dict:
    db = database.get_db()
    result = db.table("users").select("*").eq("email", email).execute()
    if not result.data:
        raise ValueError("User not found")

    user = result.data[0]
    now = datetime.now(timezone.utc)

    if user["otp_code"] != otp_code:
        attempts = (user.get("otp_attempts") or 0) + 1
        db.table("users").update({"otp_attempts": attempts}).eq("id", user["id"]).execute()
        raise ValueError("Invalid OTP")

    expires_str = user["otp_expires_at"]
    if expires_str.endswith("Z"):
        expires_str = expires_str[:-1] + "+00:00"
    expires = datetime.fromisoformat(expires_str)
    if now > expires:
        raise ValueError("OTP expired")

    db.table("users").update({
        "email_verified": True,
        "otp_code": None,
        "otp_expires_at": None,
        "otp_attempts": 0,
    }).eq("id", user["id"]).execute()

    log_event("auth", "user.otp_verified", user_id=str(user["id"]))
    token = _make_token(str(user["id"]), user["email"])
    return {"access_token": token, "token_type": "bearer", "user_id": str(user["id"]), "email": user["email"]}


def login(data: LoginRequest) -> dict:
    db = database.get_db()
    result = db.table("users").select("*").eq("email", data.email).execute()
    if not result.data:
        raise ValueError("Invalid credentials")

    user = result.data[0]
    if not _verify(data.password, user["password_hash"]):
        raise ValueError("Invalid credentials")
    if not user["email_verified"]:
        raise ValueError("Email not verified. Check your inbox for OTP.")

    log_event("auth", "user.login", user_id=str(user["id"]))
    token = _make_token(str(user["id"]), user["email"])
    return {"access_token": token, "token_type": "bearer", "user_id": str(user["id"]), "email": user["email"]}


def forgot_password(email: str) -> dict:
    db = database.get_db()
    result = db.table("users").select("id").eq("email", email).execute()
    if not result.data:
        return {"message": "If that email exists, a reset link was sent"}

    user_id = result.data[0]["id"]
    token = secrets.token_urlsafe(32)
    expires = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()

    db.table("users").update({
        "reset_token": token,
        "reset_token_expires_at": expires,
    }).eq("id", user_id).execute()

    log_event("auth", "user.forgot_password", user_id=str(user_id))
    return {"message": "If that email exists, a reset link was sent", "reset_token": token}


def reset_password(token: str, new_password: str) -> dict:
    db = database.get_db()
    result = db.table("users").select("*").eq("reset_token", token).execute()
    if not result.data:
        raise ValueError("Invalid or expired reset token")

    user = result.data[0]
    expires_str = user["reset_token_expires_at"]
    if expires_str.endswith("Z"):
        expires_str = expires_str[:-1] + "+00:00"
    if datetime.now(timezone.utc) > datetime.fromisoformat(expires_str):
        raise ValueError("Reset token expired")

    db.table("users").update({
        "password_hash": _hash(new_password),
        "reset_token": None,
        "reset_token_expires_at": None,
    }).eq("id", user["id"]).execute()

    log_event("auth", "user.password_reset", user_id=str(user["id"]))
    return {"message": "Password updated successfully"}
