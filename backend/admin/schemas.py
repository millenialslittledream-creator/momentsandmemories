from pydantic import BaseModel
from typing import Optional


class AdminUserResponse(BaseModel):
    id: str
    email: Optional[str]
    created_at: str


class AdminEventResponse(BaseModel):
    id: str
    title: str
    status: str
    user_id: str
    created_at: str


class ModerateEventRequest(BaseModel):
    status: str  # "archived" | "published" | "draft"


class ShopItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category: str
    image_url: Optional[str] = None
    stock: int = 0
    is_active: bool = True


class ShopItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    stock: Optional[int] = None
    is_active: Optional[bool] = None
