from fastapi import APIRouter, Depends, HTTPException, Query
from middleware.auth import require_admin
from admin.schemas import ModerateEventRequest, ShopItemCreate, ShopItemUpdate
from admin import service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
def get_stats(_: None = Depends(require_admin)):
    return service.get_platform_stats()


@router.get("/users")
def list_users(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    _: None = Depends(require_admin),
):
    return service.list_users(limit=limit, offset=offset)


@router.delete("/users/{user_id}")
def delete_user(user_id: str, _: None = Depends(require_admin)):
    return service.delete_user(user_id)


@router.get("/events")
def list_all_events(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    _: None = Depends(require_admin),
):
    return service.list_all_events(limit=limit, offset=offset)


@router.put("/events/{event_id}/moderate")
def moderate_event(
    event_id: str,
    data: ModerateEventRequest,
    _: None = Depends(require_admin),
):
    try:
        return service.moderate_event(event_id, data.status)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/users/{user_id}")
def get_user_profile(user_id: str, _: None = Depends(require_admin)):
    try:
        return service.get_user_profile(user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── Shop management ──────────────────────────────────────────────────────────

@router.get("/shop/items")
def list_shop_items(_: None = Depends(require_admin)):
    return service.list_all_shop_items()


@router.post("/shop/items", status_code=201)
def create_shop_item(data: ShopItemCreate, _: None = Depends(require_admin)):
    return service.create_shop_item(data.model_dump(exclude_none=False))


@router.put("/shop/items/{item_id}")
def update_shop_item(item_id: str, data: ShopItemUpdate, _: None = Depends(require_admin)):
    try:
        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        return service.update_shop_item(item_id, updates)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/shop/items/{item_id}")
def delete_shop_item(item_id: str, _: None = Depends(require_admin)):
    return service.delete_shop_item(item_id)
