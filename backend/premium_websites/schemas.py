from pydantic import BaseModel
from typing import Optional, Dict, Any


class CreatePremiumSiteRequest(BaseModel):
    slug: str
    event_key: str  # 'marriage' | 'birthday' | <EventKey>
    design_id: str
    theme_id: str
    content: Dict[str, Any] = {}
    published: bool = False


class UpdatePremiumSiteRequest(BaseModel):
    slug: Optional[str] = None
    event_key: Optional[str] = None
    design_id: Optional[str] = None
    theme_id: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    published: Optional[bool] = None
