from pydantic import BaseModel


class GalleryPhotoResponse(BaseModel):
    id: str
    event_id: str
    public_url: str
    uploaded_by_name: str | None = None
    approved: bool
    created_at: str
