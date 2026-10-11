from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class CreateEventRequest(BaseModel):
    title: str = Field(max_length=300)
    description: Optional[str] = Field(default=None, max_length=10000)
    event_date: str = Field(max_length=64)
    event_time: Optional[str] = Field(default=None, max_length=64)
    location: Optional[str] = Field(default=None, max_length=500)
    template_id: Optional[str] = None
    cover_image_url: Optional[str] = None
    # Publish state ('draft' | 'published' | 'archived'). The create flow
    # publishes the evite the moment the host reaches the Share step so the
    # public link works immediately; omitted → 'draft'.
    status: Optional[str] = None
    # Full create-flow form snapshot, used to re-render the designed
    # invitation on the public evite page.
    form_data: Optional[Dict[str, Any]] = None
    rsvp_enabled: Optional[bool] = None
    rsvp_config: Optional[Dict[str, Any]] = None


class UpdateEventRequest(BaseModel):
    title: Optional[str] = Field(default=None, max_length=300)
    description: Optional[str] = Field(default=None, max_length=10000)
    event_date: Optional[str] = Field(default=None, max_length=64)
    event_time: Optional[str] = Field(default=None, max_length=64)
    location: Optional[str] = Field(default=None, max_length=500)
    status: Optional[str] = None
    template_id: Optional[str] = None
    cover_image_url: Optional[str] = None
    form_data: Optional[Dict[str, Any]] = None
    rsvp_enabled: Optional[bool] = None
    rsvp_config: Optional[Dict[str, Any]] = None


class InviteeIn(BaseModel):
    name: Optional[str] = Field(default=None, max_length=200)
    email: Optional[str] = Field(default=None, max_length=320)
    phone: Optional[str] = Field(default=None, max_length=32)
    source: str = Field(default="manual", max_length=32)
