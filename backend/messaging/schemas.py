from pydantic import BaseModel, Field
from typing import Optional


class SendMessageRequest(BaseModel):
    body: str = Field(max_length=2000)
    sender_name: Optional[str] = Field(default="", max_length=100)


class MessageResponse(BaseModel):
    id: str
    event_id: str
    sender_id: str
    sender_type: str
    sender_name: Optional[str]
    body: str
    created_at: str
