from pydantic import BaseModel, Field
from typing import Dict, Optional


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
    status: str          # "accepted" | "declined" | "maybe"
    message: Optional[str] = ""
    dietary_requirements: Optional[str] = ""
    party_size: Optional[int] = None
    kids_count: Optional[int] = None
    food_preference: Optional[str] = None
    adults_count: Optional[int] = None
    children_count: Optional[int] = None
    meal_preferences: Dict[str, int] = Field(default_factory=dict)


class RSVPResponse(BaseModel):
    invitee_id: str
    status: str
    message: str
