import json
from pydantic import BaseModel, Field, model_validator
from typing import Any


class DraftUpsertRequest(BaseModel):
    step: int = Field(ge=0, le=50)
    event_type: str | None = Field(default=None, max_length=100)
    form_data: dict[str, Any] = {}
    selected_template: str | None = Field(default=None, max_length=200)
    guests: list[dict[str, Any]] = Field(default=[], max_length=1000)
    delivery_preference: str = Field(default="email", max_length=32)

    @model_validator(mode="after")
    def _bounded_size(self):
        if len(json.dumps([self.form_data, self.guests], default=str)) > 2_000_000:
            raise ValueError("Draft is too large")
        return self


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
