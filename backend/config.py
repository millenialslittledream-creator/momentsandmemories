from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str
    supabase_service_key: str
    jwt_secret: str
    jwt_expire_minutes: int = 60
    sendgrid_api_key: str = ""
    google_client_id: str = ""
    google_client_secret: str = ""
    frontend_url: str = "http://localhost:5173"
    backend_url: str = ""
    admin_secret: str = ""
    # Amazon SES (bulk email)
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "ap-southeast-2"
    ses_from_email: str = ""
    # Telnyx (SMS) — https://portal.telnyx.com
    telnyx_api_key: str = ""
    telnyx_from_number: str = ""          # E.164 number or alphanumeric sender ID
    telnyx_messaging_profile_id: str = ""  # optional; required if from-number isn't tied to a profile

    # Shared rate-limit store (Upstash Redis REST). Vercel's Redis integration injects KV_REST_API_*.
    upstash_redis_rest_url: str = ""
    upstash_redis_rest_token: str = ""
    kv_rest_api_url: str = ""
    kv_rest_api_token: str = ""

    # Hardening switches (safe defaults for production)
    allow_localhost_cors: bool = False   # dev only: accept any http://localhost:<port> origin
    enable_api_docs: bool = False        # dev only: expose /docs, /redoc, /openapi.json
    rate_limits_enabled: bool = True     # STAGING ONLY: set false so load tests measure throughput, not 429s
    sms_allowed_prefixes: str = "+1"     # comma-separated E.164 prefixes SMS may be sent to (blocks SMS pumping)

    class Config:
        env_file = ".env"


settings = Settings()
