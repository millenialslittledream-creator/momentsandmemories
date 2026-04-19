from pydantic import BaseModel
from typing import Optional


class SendNotificationRequest(BaseModel):
    user_id: Optional[str] = None
    type: str  # email | sms | whatsapp
    title: str
    body: str
    recipient: str  # email address or phone number


class WhatsAppShareResponse(BaseModel):
    share_url: str
