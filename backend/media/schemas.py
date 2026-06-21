from pydantic import BaseModel
from typing import Optional


class MediaUploadResponse(BaseModel):
    id: str
    storage_path: str
    public_url: str
    kind: str
    mime_type: Optional[str] = None
    file_size_bytes: Optional[int] = None
    created_at: str
