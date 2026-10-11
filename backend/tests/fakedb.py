"""In-memory stand-in for the Supabase client used by backend/database.get_db().

Lets tests run the REAL backend code (routers, services, middleware) end to end without a
database. Supports the subset of the PostgREST builder API the backend uses.
"""
import os
import time
import uuid
import threading
from datetime import datetime, timezone
from types import SimpleNamespace

LATENCY = float(os.environ.get("FAKE_DB_LATENCY_MS", "0")) / 1000.0
_lock = threading.Lock()
STORE: dict[str, list[dict]] = {}
LOG_COUNT = 0
UPLOADS: list[str] = []
TOKENS = {
    "token-alice": SimpleNamespace(id="11111111-1111-1111-1111-111111111111", email="alice@test.com"),
    "token-bob": SimpleNamespace(id="22222222-2222-2222-2222-222222222222", email="bob@test.com"),
}


class Result:
    def __init__(self, data, count=None):
        self.data = data
        self.count = count


class Query:
    def __init__(self, name):
        self.name = name
        self.mode = "select"
        self.payload = None
        self.filters = []
        self.order_col = None
        self.desc = False
        self.lim = None
        self.off = 0
        self.want_count = False
        self.conflict = None

    # operations
    def select(self, cols="*", count=None):
        self.mode = "select"
        self.want_count = count == "exact"
        return self

    def insert(self, rows):
        self.mode, self.payload = "insert", rows
        return self

    def update(self, vals):
        self.mode, self.payload = "update", vals
        return self

    def delete(self):
        self.mode = "delete"
        return self

    def upsert(self, row, on_conflict=None):
        self.mode, self.payload, self.conflict = "upsert", row, on_conflict
        return self

    # filters
    def eq(self, c, v): self.filters.append(lambda r: str(r.get(c)) == str(v)); return self
    def neq(self, c, v): self.filters.append(lambda r: str(r.get(c)) != str(v)); return self
    def in_(self, c, vs): self.filters.append(lambda r: r.get(c) in vs); return self
    def lt(self, c, v): self.filters.append(lambda r: r.get(c) is not None and str(r.get(c)) < str(v)); return self
    def gte(self, c, v): self.filters.append(lambda r: r.get(c) is not None and r.get(c) >= v); return self
    def order(self, c, desc=False): self.order_col, self.desc = c, desc; return self
    def limit(self, n): self.lim = n; return self
    def offset(self, n): self.off = n; return self

    def execute(self):
        global LOG_COUNT
        if LATENCY:
            time.sleep(LATENCY)
        if self.name == "logs" and self.mode == "insert":
            LOG_COUNT += 1  # don't retain – keeps load-test memory flat
            return Result([{}])
        with _lock:
            rows = STORE.setdefault(self.name, [])
            match = lambda r: all(f(r) for f in self.filters)  # noqa: E731
            if self.mode == "insert":
                items = self.payload if isinstance(self.payload, list) else [self.payload]
                out = []
                for it in items:
                    row = dict(it)
                    row.setdefault("id", str(uuid.uuid4()))
                    row.setdefault("created_at", datetime.now(timezone.utc).isoformat())
                    rows.append(row)
                    out.append(dict(row))
                return Result(out)
            if self.mode == "upsert":
                row = dict(self.payload)
                for r in rows:
                    if r.get(self.conflict) == row.get(self.conflict):
                        r.update(row)
                        return Result([dict(r)])
                row.setdefault("id", str(uuid.uuid4()))
                rows.append(row)
                return Result([dict(row)])
            hits = [r for r in rows if match(r)]
            if self.mode == "update":
                for r in hits:
                    r.update(self.payload)
                return Result([dict(r) for r in hits])
            if self.mode == "delete":
                for r in hits:
                    rows.remove(r)
                return Result([dict(r) for r in hits])
            out = [dict(r) for r in hits]
            if self.order_col:
                out.sort(key=lambda r: str(r.get(self.order_col)), reverse=self.desc)
            total = len(out)
            out = out[self.off:]
            if self.lim is not None:
                out = out[: self.lim]
            return Result(out, count=total if self.want_count else None)


class _Rpc:
    def execute(self):
        return Result([{"sum": 0}])


class _Bucket:
    def upload(self, path, content, file_options=None):
        UPLOADS.append(path)

    def get_public_url(self, path):
        return f"https://fake.storage/{path}"

    def remove(self, paths):
        pass


class FakeDB:
    def table(self, name): return Query(name)
    def rpc(self, name, params=None): return _Rpc()

    class _Auth:
        def get_user(self, token):
            if LATENCY:
                time.sleep(LATENCY)
            user = TOKENS.get(token)
            if not user:
                raise Exception("invalid token")
            return SimpleNamespace(user=user)

    auth = _Auth()
    storage = SimpleNamespace(from_=lambda b: _Bucket())


def reset():
    global LOG_COUNT
    STORE.clear()
    UPLOADS.clear()
    LOG_COUNT = 0
