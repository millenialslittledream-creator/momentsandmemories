from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class CreateEventRequest(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: str
    event_time: Optional[str] = None
    location: Optional[str] = None
    template_id: Optional[str] = None
    cover_image_url: Optional[str] = None
    # Publish state ('draft' | 'published' | 'archived'). The create flow
    # publishes the evite the moment the host reaches the Share step so the
    # public link works immediately; omitted → 'draft'.
    status: Optional[str] = None
    # Full create-flow form snapshot, used to re-render the designed
    # invitation on the public evite page.
    form_data: Optional[Dict[str, Any]] = None


class UpdateEventRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[str] = None
    event_time: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    template_id: Optional[str] = None
    cover_image_url: Optional[str] = None
    form_data: Optional[Dict[str, Any]] = None


class InviteeIn(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    source: str = "manual"
