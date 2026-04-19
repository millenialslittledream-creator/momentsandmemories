from pydantic import BaseModel
from typing import Optional, List


class CreateEventRequest(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: str
    event_time: Optional[str] = None
    location: Optional[str] = None
    template_id: Optional[str] = None
    cover_image_url: Optional[str] = None


class UpdateEventRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[str] = None
    event_time: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    cover_image_url: Optional[str] = None


class InviteeIn(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    source: str = "manual"
