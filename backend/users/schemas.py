from pydantic import BaseModel, Field
from typing import Optional


class UserProfile(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    avatar_url: Optional[str] = None
    created_at: str


class UpdateProfileRequest(BaseModel):
    first_name: Optional[str] = Field(default=None, max_length=100)
    last_name: Optional[str] = Field(default=None, max_length=100)
    avatar_url: Optional[str] = Field(default=None, max_length=500, pattern=r"^https://")
