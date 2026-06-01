from pydantic import BaseModel
from typing import Optional


class SendMessageRequest(BaseModel):
    body: str
    sender_name: Optional[str] = ""


class MessageResponse(BaseModel):
    id: str
    event_id: str
    sender_id: str
    sender_type: str
    sender_name: Optional[str]
    body: str
    created_at: str
