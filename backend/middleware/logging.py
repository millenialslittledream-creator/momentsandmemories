import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from database import get_db


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        start = time.time()

        response = await call_next(request)

        duration_ms = int((time.time() - start) * 1000)

        try:
            db = get_db()
            db.table("logs").insert({
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
            }).execute()
        except Exception:
            pass  # Never let logging break a request

        return response


def log_event(
    module: str,
    action: str,
    level: str = "info",
    user_id: str | None = None,
    metadata: dict | None = None,
) -> None:
    """Log a business event to the logs table."""
    try:
        db = get_db()
        db.table("logs").insert({
            "level": level,
            "module": module,
            "action": action,
            "user_id": user_id,
            "metadata": metadata or {},
        }).execute()
    except Exception:
        pass
