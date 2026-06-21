from pydantic import BaseModel
from typing import Optional, Dict, Any


class CreateEviteCustomizationRequest(BaseModel):
    event_id: Optional[str] = None
    template_id: str
    field_overrides: Dict[str, Any] = {}
    photo_overlay: Optional[Dict[str, Any]] = None


class UpdateEviteCustomizationRequest(BaseModel):
    event_id: Optional[str] = None
    field_overrides: Optional[Dict[str, Any]] = None
    photo_overlay: Optional[Dict[str, Any]] = None
