"""Shared hit counter used by rate limiting and admin lockout.

With UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (or the KV_REST_API_* names Vercel's
Redis integration injects) every server instance shares one counter, so limits hold across
Vercel's many serverless instances. Without them, or if Redis is unreachable, it falls back
to per-process memory: protection degrades, the site does not go down.
"""
import logging
import threading
import time
from collections import deque

import httpx

from config import settings

logger = logging.getLogger(__name__)

_TIMEOUT_SECONDS = 0.8
_MAX_LOCAL_KEYS = 20_000
_local: dict[str, deque] = {}
_local_lock = threading.Lock()


def _remote() -> tuple[str, str] | None:
    url = settings.upstash_redis_rest_url or settings.kv_rest_api_url
    token = settings.upstash_redis_rest_token or settings.kv_rest_api_token
    return (url.rstrip("/"), token) if url and token else None


def _pipeline(url: str, token: str, commands: list[list]) -> list:
    response = httpx.post(
        f"{url}/pipeline",
        json=commands,
        headers={"Authorization": f"Bearer {token}"},
        timeout=_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return [item.get("result") for item in response.json()]


def _bucket(key: str, window: int) -> tuple[str, int]:
    """Fixed-window bucket key and the seconds left in the current window."""
    now = time.time()
    return f"rl:{key}:{int(now // window)}", max(1, int(window - (now % window)))


def _local_hits(key: str, window: int, now: float) -> deque:
    hits = _local.setdefault(key, deque())
    while hits and hits[0] <= now - window:
        hits.popleft()
    return hits


def _local_incr(key: str, window: int) -> tuple[int, int]:
    with _local_lock:
        now = time.monotonic()
        if len(_local) > _MAX_LOCAL_KEYS:
            for stale in [k for k, v in _local.items() if not v or v[-1] <= now - window]:
                del _local[stale]
        hits = _local_hits(key, window, now)
        hits.append(now)
        return len(hits), max(1, int(window - (now - hits[0])))


def _local_peek(key: str, window: int) -> int:
    with _local_lock:
        return len(_local_hits(key, window, time.monotonic()))


def incr(key: str, window: int) -> tuple[int, int]:
    """Record one hit. Returns (hits in the current window, seconds until the window resets)."""
    remote = _remote()
    if remote:
        bucket, retry = _bucket(key, window)
        try:
            count, _ = _pipeline(*remote, [["INCR", bucket], ["EXPIRE", bucket, window * 2, "NX"]])
            return int(count), retry
        except Exception as exc:  # fail open to local counting; never block users on Redis trouble
            logger.warning("rate-limit store unavailable, using local counter: %s", exc)
    return _local_incr(key, window)


def peek(key: str, window: int) -> int:
    """Hits in the current window without recording one."""
    remote = _remote()
    if remote:
        bucket, _ = _bucket(key, window)
        try:
            (count,) = _pipeline(*remote, [["GET", bucket]])
            return int(count or 0)
        except Exception as exc:
            logger.warning("rate-limit store unavailable, using local counter: %s", exc)
    return _local_peek(key, window)


def reset_local() -> None:
    """Test helper."""
    with _local_lock:
        _local.clear()
