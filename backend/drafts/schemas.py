from pydantic import BaseModel
from typing import Any


class DraftUpsertRequest(BaseModel):
    step: int
    event_type: str | None = None
    form_data: dict[str, Any] = {}
    selected_template: str | None = None
    guests: list[dict[str, Any]] = []
    delivery_preference: str = "email"


class DraftResponse(BaseModel):
    id: str
    user_id: str
    step: int
    event_type: str | None
    form_data: dict[str, Any]
    selected_template: str | None
    guests: list[dict[str, Any]]
    delivery_preference: str
    created_at: str
    updated_at: str
