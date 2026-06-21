from fastapi import APIRouter, Depends, HTTPException, Query
from middleware.auth import get_current_user
from gallery import service

router = APIRouter(prefix="/gallery", tags=["gallery"])


@router.get("/{event_id}")
def list_photos_for_owner(event_id: str, current_user: dict = Depends(get_current_user)):
    try:
        return service.list_photos_for_owner(current_user["sub"], event_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/photos/{photo_id}/approval")
def set_photo_approval(photo_id: str, approved: bool = Query(...), current_user: dict = Depends(get_current_user)):
    try:
        return service.set_photo_approval(current_user["sub"], photo_id, approved)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/photos/{photo_id}")
def delete_photo(photo_id: str, current_user: dict = Depends(get_current_user)):
    try:
        service.delete_photo(current_user["sub"], photo_id)
        return {"status": "deleted"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
