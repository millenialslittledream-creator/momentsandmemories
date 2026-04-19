from pydantic import BaseModel
from typing import Optional, List


class ContactIn(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class ContactsSubmitRequest(BaseModel):
    contacts: List[ContactIn]


class QRSessionResponse(BaseModel):
    session_token: str
    qr_code_base64: str
    expires_in_seconds: int = 900
