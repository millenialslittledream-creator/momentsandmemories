from fastapi import APIRouter, Depends, HTTPException
from middleware.auth import get_current_user
from event_websites.schemas import CreateEventWebsiteRequest, UpdateEventWebsiteRequest
from event_websites import service

router = APIRouter(prefix="/event-websites", tags=["event-websites"])


@router.post("")
def create_website(data: CreateEventWebsiteRequest, current_user: dict = Depends(get_current_user)):
    try:
        return service.create_event_website(current_user["sub"], data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("")
def list_websites(current_user: dict = Depends(get_current_user)):
    return service.list_event_websites(current_user["sub"])


@router.get("/{website_id}")
def get_website(website_id: str, current_user: dict = Depends(get_current_user)):
    try:
        return service.get_event_website(current_user["sub"], website_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{website_id}")
def update_website(
    website_id: str,
    data: UpdateEventWebsiteRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        return service.update_event_website(current_user["sub"], website_id, data)
    except ValueError as e:
        status_code = 400 if "taken" in str(e) else 404
        raise HTTPException(status_code=status_code, detail=str(e))


@router.delete("/{website_id}")
def delete_website(website_id: str, current_user: dict = Depends(get_current_user)):
    try:
        service.delete_event_website(current_user["sub"], website_id)
        return {"status": "deleted"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
