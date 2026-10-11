"""In-memory sliding-window rate limiting.

Per-process only: with several workers/instances the effective limit is multiplied, so
treat it as abuse protection (SMS/email pumping, brute force), not as exact accounting.
"""
import threading
import time
from collections import deque

from fastapi import Depends, HTTPException, Request, status

from middleware.auth import get_current_user

_MAX_KEYS = 20_000
_registry: list["_Window"] = []


def client_ip(request: Request) -> str:
    """Rightmost X-Forwarded-For entry = the address our own proxy (nginx/Vercel) saw."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[-1].strip() or "unknown"
    return request.client.host if request.client else "unknown"


class _Window:
    def __init__(self, limit: int, window_seconds: int):
        self.limit = limit
        self.window = window_seconds
        self._hits: dict[str, deque] = {}
        self._lock = threading.Lock()
        _registry.append(self)

    def _prune(self, key: str, now: float) -> deque:
        hits = self._hits.setdefault(key, deque())
        while hits and hits[0] <= now - self.window:
            hits.popleft()
        return hits

    def count(self, key: str) -> int:
        with self._lock:
            return len(self._prune(key, time.monotonic()))

    def record(self, key: str) -> None:
        with self._lock:
            now = time.monotonic()
            if len(self._hits) > _MAX_KEYS:
                for k in [k for k, v in self._hits.items() if not v or v[-1] <= now - self.window]:
                    del self._hits[k]
            self._prune(key, now).append(now)

    def check(self, key: str) -> None:
        """Record a hit; raise 429 if the key is over the limit."""
        with self._lock:
            now = time.monotonic()
            hits = self._prune(key, now)
            if len(hits) >= self.limit:
                retry = max(1, int(self.window - (now - hits[0])))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please slow down and try again shortly.",
                    headers={"Retry-After": str(retry)},
                )
            hits.append(now)

    def clear(self) -> None:
        with self._lock:
            self._hits.clear()


def reset_all() -> None:
    """Test helper: forget every recorded hit."""
    for window in _registry:
        window.clear()


def ip_limit(name: str, limit: int, window_seconds: int):
    """Dependency factory: at most `limit` requests per `window_seconds` per client IP."""
    window = _Window(limit, window_seconds)

    def dependency(request: Request) -> None:
        window.check(f"{name}:{client_ip(request)}")

    return dependency


def user_limit(name: str, limit: int, window_seconds: int):
    """Dependency factory: at most `limit` requests per `window_seconds` per signed-in user."""
    window = _Window(limit, window_seconds)

    def dependency(current_user: dict = Depends(get_current_user)) -> None:
        window.check(f"{name}:{current_user['sub']}")

    return dependency
