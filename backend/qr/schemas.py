from pydantic import BaseModel, Field
from typing import Optional, List


class ContactIn(BaseModel):
    name: Optional[str] = Field(default=None, max_length=200)
    email: Optional[str] = Field(default=None, max_length=320)
    phone: Optional[str] = Field(default=None, max_length=64)


class ContactsSubmitRequest(BaseModel):
    contacts: List[ContactIn] = Field(max_length=500)


class QRSessionResponse(BaseModel):
    session_token: str
    qr_code_base64: str
    expires_in_seconds: int = 900
