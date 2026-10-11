import hmac
import threading
import time
from collections import deque
from fastapi import Depends, HTTPException, Header, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import database
from config import settings

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        db = database.get_db()
        response = db.auth.get_user(credentials.credentials)
        user = response.user
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return {"sub": user.id, "email": user.email}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


_ADMIN_MAX_FAILURES = 10
_ADMIN_WINDOW_SECONDS = 600
_admin_failures: dict[str, deque] = {}
_admin_lock = threading.Lock()


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[-1].strip() or "unknown"
    return request.client.host if request.client else "unknown"


def reset_admin_lockouts() -> None:
    """Test helper."""
    with _admin_lock:
        _admin_failures.clear()


def require_admin(request: Request, x_admin_secret: str = Header(default="")) -> None:
    expected = settings.admin_secret
    if not expected:
        # Never fall back to "empty header matches empty secret".
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin access is not configured",
        )

    ip = _client_ip(request)
    now = time.monotonic()
    with _admin_lock:
        failures = _admin_failures.setdefault(ip, deque())
        while failures and failures[0] <= now - _ADMIN_WINDOW_SECONDS:
            failures.popleft()
        if len(failures) >= _ADMIN_MAX_FAILURES:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed attempts. Try again later.",
                headers={"Retry-After": str(_ADMIN_WINDOW_SECONDS)},
            )
        if not hmac.compare_digest(x_admin_secret.encode(), expected.encode()):
            failures.append(now)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required",
            )
        failures.clear()
