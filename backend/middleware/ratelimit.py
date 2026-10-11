"""Rate limiting on top of the shared counter (see middleware/counter.py).

Redis-backed when configured (limits hold across all serverless instances), per-process
otherwise. Limits are abuse protection (SMS/email pumping, brute force, upload floods).
"""
from fastapi import Depends, HTTPException, Request, status

from config import settings
from middleware import counter
from middleware.auth import get_current_user, client_ip


def _check(name: str, identity: str, limit: int, window_seconds: int) -> None:
    if not settings.rate_limits_enabled:
        return
    hits, retry_after = counter.incr(f"{name}:{identity}", window_seconds)
    if hits > limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please slow down and try again shortly.",
            headers={"Retry-After": str(retry_after)},
        )


def reset_all() -> None:
    """Test helper: forget every recorded hit."""
    counter.reset_local()


def ip_limit(name: str, limit: int, window_seconds: int):
    """Dependency factory: at most `limit` requests per `window_seconds` per client IP."""

    def dependency(request: Request) -> None:
        _check(name, client_ip(request), limit, window_seconds)

    return dependency


def user_limit(name: str, limit: int, window_seconds: int):
    """Dependency factory: at most `limit` requests per `window_seconds` per signed-in user."""

    def dependency(current_user: dict = Depends(get_current_user)) -> None:
        _check(name, current_user["sub"], limit, window_seconds)

    return dependency
