from pydantic import BaseModel
from typing import Literal, Optional, List


class SendNotificationRequest(BaseModel):
    user_id: Optional[str] = None
    type: Literal["email", "sms", "whatsapp"]
    title: str
    body: str
    recipient: str  # email address or phone number


class WhatsAppShareResponse(BaseModel):
    share_url: str


# ── Bulk messaging ────────────────────────────────────────────────────────────

class BulkRecipient(BaseModel):
    name: str = ""
    email: Optional[str] = None
    phone: Optional[str] = None


class BulkSendRequest(BaseModel):
    # Either supply event_id (auto-fetches all invitees) OR a manual recipients list
    event_id: Optional[str] = None
    recipients: Optional[List[BulkRecipient]] = None
    channel: Literal["email", "sms"]
    subject: str           # email subject line or SMS prefix
    body: str              # supports {name} placeholder for personalisation


class BulkSendResponse(BaseModel):
    total: int
    status: str            # "processing" — sends happen in the background
