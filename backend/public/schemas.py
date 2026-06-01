from pydantic import BaseModel
from typing import Optional


class PublicEventResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    event_date: str
    event_time: Optional[str]
    location: Optional[str]
    cover_image_url: Optional[str]
    rsvp_enabled: bool
    invitee_count: int


class RSVPRequest(BaseModel):
    status: str          # "accepted" | "declined"
    message: Optional[str] = ""
    dietary_requirements: Optional[str] = ""


class RSVPResponse(BaseModel):
    invitee_id: str
    status: str
    message: str
