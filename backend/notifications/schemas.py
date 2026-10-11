from pydantic import BaseModel, Field
from typing import Literal, Optional, List


class SendNotificationRequest(BaseModel):
    user_id: Optional[str] = None  # ignored by the API: the caller's own id is always used
    type: Literal["email", "sms", "whatsapp"]
    title: str = Field(max_length=200)
    body: str = Field(max_length=2000)
    recipient: str = Field(max_length=320)  # email address or phone number


class WhatsAppShareResponse(BaseModel):
    share_url: str


# ── Bulk messaging ────────────────────────────────────────────────────────────

class BulkRecipient(BaseModel):
    name: str = Field(default="", max_length=200)
    email: Optional[str] = Field(default=None, max_length=320)
    phone: Optional[str] = Field(default=None, max_length=32)


class BulkSendRequest(BaseModel):
    # Either supply event_id (auto-fetches all invitees) OR a manual recipients list
    event_id: Optional[str] = None
    recipients: Optional[List[BulkRecipient]] = Field(default=None, max_length=200)
    channel: Literal["email", "sms"]
    subject: str = Field(max_length=200)   # email subject line or SMS prefix
    body: str = Field(max_length=2000)     # supports {name} placeholder for personalisation


class BulkSendResponse(BaseModel):
    total: int
    status: str            # "processing" — sends happen in the background
