from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class CreateInvitationBookRequest(BaseModel):
    event_id: str
    title: Optional[str] = None
    pages: List[Dict[str, Any]] = []
    published: bool = False


class UpdateInvitationBookRequest(BaseModel):
    title: Optional[str] = None
    pages: Optional[List[Dict[str, Any]]] = None
    published: Optional[bool] = None
