import json
from pydantic import BaseModel, Field, field_validator
from typing import Literal, Optional, List


class OrderItemIn(BaseModel):
    shop_item_id: str = Field(max_length=64)
    quantity: int = Field(ge=1, le=100)


class CreateOrderRequest(BaseModel):
    items: List[OrderItemIn] = Field(min_length=1, max_length=50)
    shipping_address: Optional[dict] = None

    @field_validator("shipping_address")
    @classmethod
    def _small_address(cls, value):
        if value is not None and len(json.dumps(value, default=str)) > 4000:
            raise ValueError("shipping_address is too large")
        return value


class UpdateOrderStatusRequest(BaseModel):
    status: Literal["pending", "processing", "shipped", "delivered", "cancelled"]
