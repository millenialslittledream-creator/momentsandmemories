import time
import uuid
import threading
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from database import get_db


# Cap concurrent log writers: one unbounded thread per request lets a request flood
# exhaust threads/sockets. Excess log lines are dropped instead of piling up.
_log_slots = threading.BoundedSemaphore(32)


def _write_log(**kwargs) -> None:
    try:
        db = get_db()
        db.table("logs").insert(kwargs).execute()
    except Exception:
        pass
    finally:
        _log_slots.release()


def _spawn_log(**kwargs) -> None:
    if not _log_slots.acquire(blocking=False):
        return
    try:
        threading.Thread(target=_write_log, daemon=True, kwargs=kwargs).start()
    except Exception:
        _log_slots.release()


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        start = time.time()

        response = await call_next(request)

        duration_ms = int((time.time() - start) * 1000)

        if request.url.path.endswith("/health"):
            return response

        _spawn_log(**{
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
        })

        return response


def log_event(
    module: str,
    action: str,
    level: str = "info",
    user_id: str | None = None,
    metadata: dict | None = None,
) -> None:
    """Fire-and-forget log — never blocks the caller."""
    _spawn_log(
        level=level,
        module=module,
        action=action,
        user_id=user_id,
        metadata=metadata or {},
    )
