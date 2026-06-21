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
    # AWS End User Messaging SMS (bulk SMS, US)
    aws_sms_access_key_id: str = ""
    aws_sms_secret_access_key: str = ""
    aws_sms_region: str = "ap-southeast-2"
    sms_origination_number: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
