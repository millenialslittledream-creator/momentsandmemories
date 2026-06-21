from supabase import create_client, Client
from supabase.lib.client_options import ClientOptions
from config import settings

_client: Client | None = None

# Forces httpx to open a fresh connection per request instead of reusing a pooled
# keep-alive one. Without this, long-running local dev processes intermittently hit
# httpx.ReadError (stale pooled socket) on outbound Supabase calls, which surfaces to
# the browser as a CORS error (the response never reaches CORSMiddleware to get headers
# attached). Slightly higher per-request latency, but eliminates that whole failure class.
_CLIENT_OPTIONS = ClientOptions(headers={"Connection": "close"})


def get_db() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.supabase_url, settings.supabase_service_key, options=_CLIENT_OPTIONS)
    return _client
