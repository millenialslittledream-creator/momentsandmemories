from pydantic import BaseModel
from typing import Literal, Optional, List


class OrderItemIn(BaseModel):
    shop_item_id: str
    quantity: int


class CreateOrderRequest(BaseModel):
    items: List[OrderItemIn]
    shipping_address: Optional[dict] = None


class UpdateOrderStatusRequest(BaseModel):
    status: Literal["pending", "processing", "shipped", "delivered", "cancelled"]
