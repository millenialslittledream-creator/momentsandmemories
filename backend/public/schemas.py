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
    status: str = Field(max_length=20)          # "accepted" | "declined" | "maybe"
    message: Optional[str] = Field(default="", max_length=1000)
    dietary_requirements: Optional[str] = Field(default="", max_length=500)
    party_size: Optional[int] = Field(default=None, le=100)
    kids_count: Optional[int] = Field(default=None, le=100)
    food_preference: Optional[str] = Field(default=None, max_length=100)
    adults_count: Optional[int] = Field(default=None, le=100)
    children_count: Optional[int] = Field(default=None, le=100)
    meal_preferences: Dict[str, int] = Field(default_factory=dict, max_length=30)


class RSVPResponse(BaseModel):
    invitee_id: str
    status: str
    message: str
