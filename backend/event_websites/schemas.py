from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class CreateEventWebsiteRequest(BaseModel):
    event_id: str
    slug: str
    sections: List[Dict[str, Any]] = []
    theme: Dict[str, Any] = {}
    published: bool = False


class UpdateEventWebsiteRequest(BaseModel):
    slug: Optional[str] = None
    sections: Optional[List[Dict[str, Any]]] = None
    theme: Optional[Dict[str, Any]] = None
    published: Optional[bool] = None
