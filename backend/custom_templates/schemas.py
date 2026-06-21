from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class CreateUserTemplateRequest(BaseModel):
    name: Optional[str] = None
    event_type: Optional[str] = None
    event_id: Optional[str] = None
    canvas_width: int
    canvas_height: int
    background: Dict[str, Any] = {"type": "color", "value": "#ffffff"}
    elements: List[Dict[str, Any]] = []
    is_draft: bool = True


class UpdateUserTemplateRequest(BaseModel):
    name: Optional[str] = None
    event_type: Optional[str] = None
    event_id: Optional[str] = None
    canvas_width: Optional[int] = None
    canvas_height: Optional[int] = None
    background: Optional[Dict[str, Any]] = None
    elements: Optional[List[Dict[str, Any]]] = None
    is_draft: Optional[bool] = None
