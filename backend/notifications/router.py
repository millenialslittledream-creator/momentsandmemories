from fastapi import APIRouter, Depends, HTTPException, Query
from middleware.auth import get_current_user
from notifications.schemas import SendNotificationRequest
from notifications import service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.post("/send")
def send_notification(data: SendNotificationRequest, current_user: dict = Depends(get_current_user)):
    try:
        return service.send_notification(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Notification failed. Please try again later.")


@router.get("/whatsapp-link")
def whatsapp_link(message: str, current_user: dict = Depends(get_current_user)):
    return {"share_url": service.get_whatsapp_link(message)}


@router.get("")
def list_notifications(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    return service.list_notifications(current_user["sub"], limit=limit, offset=offset)
