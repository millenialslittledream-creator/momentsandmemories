from fastapi import APIRouter, Depends, HTTPException
from middleware.auth import get_current_user, require_admin
from shop.schemas import CreateOrderRequest, UpdateOrderStatusRequest
from shop import service
from typing import Optional

router = APIRouter(prefix="/shop", tags=["shop"])


@router.get("/items")
def list_items(category: Optional[str] = None):
    return service.list_items(category)


@router.get("/items/{item_id}")
def get_item(item_id: str):
    try:
        return service.get_item(item_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/orders", status_code=201)
def create_order(data: CreateOrderRequest, current_user: dict = Depends(get_current_user)):
    try:
        return service.create_order(current_user["sub"], data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/orders")
def list_orders(current_user: dict = Depends(get_current_user)):
    return service.list_orders(current_user["sub"])


@router.get("/orders/{order_id}")
def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    try:
        return service.get_order(current_user["sub"], order_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/orders/{order_id}/status")
def update_order_status(
    order_id: str,
    data: UpdateOrderStatusRequest,
    _: None = Depends(require_admin),
):
    try:
        return service.update_order_status(order_id, data.status)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
