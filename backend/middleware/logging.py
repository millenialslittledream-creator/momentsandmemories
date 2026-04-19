import time
import uuid
import threading
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from database import get_db


def _write_log(**kwargs) -> None:
    try:
        db = get_db()
        db.table("logs").insert(kwargs).execute()
    except Exception:
        pass


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        start = time.time()

        response = await call_next(request)

        duration_ms = int((time.time() - start) * 1000)

        threading.Thread(target=_write_log, daemon=True, kwargs={
            "level": "info",
            "module": "middleware",
            "action": f"request.{request.method.lower()}",
            "request_id": request_id,
            "ip_address": request.client.host if request.client else None,
            "metadata": {
                "path": str(request.url.path),
                "method": request.method,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
            },
        }).start()

        return response


def log_event(
    module: str,
    action: str,
    level: str = "info",
    user_id: str | None = None,
    metadata: dict | None = None,
) -> None:
    """Fire-and-forget log — never blocks the caller."""
    threading.Thread(target=_write_log, daemon=True, kwargs={
        "level": level,
        "module": module,
        "action": action,
        "user_id": user_id,
        "metadata": metadata or {},
    }).start()
