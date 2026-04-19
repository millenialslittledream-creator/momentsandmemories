import io
import base64
import secrets
from datetime import datetime, timedelta, timezone
import qrcode
import database
from config import settings
from middleware.logging import log_event as _log


def _make_qr(url: str) -> str:
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


def create_qr_session(user_id: str, event_id: str | None = None) -> dict:
    db = database.get_db()
    token = secrets.token_urlsafe(24)
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()

    db.table("qr_contact_sessions").insert({
        "session_token": token,
        "user_id": user_id,
        "event_id": event_id,
        "status": "pending",
        "contacts_json": [],
        "expires_at": expires_at,
    }).execute()

    base = (settings.backend_url or settings.frontend_url).rstrip("/")
    import_url = f"{base}/api/qr/import/{token}"
    qr_b64 = _make_qr(import_url)

    _log("qr", "qr.session_started", user_id=user_id, metadata={"token": token})
    return {"session_token": token, "qr_code_base64": qr_b64, "expires_in_seconds": 900}


def get_session_status(token: str) -> dict:
    db = database.get_db()
    result = db.table("qr_contact_sessions").select("*").eq("session_token", token).execute()
    if not result.data:
        raise ValueError("Session not found")
    return result.data[0]


def submit_contacts(token: str, contacts: list) -> dict:
    db = database.get_db()
    result = db.table("qr_contact_sessions").select("*").eq("session_token", token).execute()
    if not result.data:
        raise ValueError("Session not found")

    session = result.data[0]
    expires_str = session["expires_at"]
    if expires_str.endswith("Z"):
        expires_str = expires_str[:-1] + "+00:00"
    expires = datetime.fromisoformat(expires_str)

    if datetime.now(timezone.utc) > expires:
        db.table("qr_contact_sessions").update({"status": "expired"}).eq("session_token", token).execute()
        raise ValueError("Session expired")

    if session["status"] != "pending":
        raise ValueError("Session already completed or expired")

    db.table("qr_contact_sessions").update({
        "status": "completed",
        "contacts_json": contacts,
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }).eq("session_token", token).execute()

    _log("qr", "qr.contacts_received", metadata={"token": token, "count": len(contacts)})
    return {"status": "completed", "count": len(contacts)}
