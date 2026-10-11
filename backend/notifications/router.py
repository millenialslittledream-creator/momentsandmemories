from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from middleware.auth import get_current_user
from middleware.ratelimit import user_limit
from notifications.schemas import SendNotificationRequest, BulkSendRequest
from notifications import service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.post("/send", dependencies=[Depends(user_limit("notif-send", 10, 60))])
def send_notification(data: SendNotificationRequest, current_user: dict = Depends(get_current_user)):
    try:
        return service.send_notification(current_user["sub"], data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Notification failed. Please try again later.")


@router.get("/whatsapp-link")
def whatsapp_link(message: str = Query(max_length=1000), current_user: dict = Depends(get_current_user)):
    return {"share_url": service.get_whatsapp_link(message)}


@router.post("/bulk-send", dependencies=[Depends(user_limit("bulk-send", 10, 3600))])
def bulk_send(
    data: BulkSendRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    """Send the same message to many recipients at once.

    - Supply **event_id** to auto-fetch all invitees for that event, OR
    - Supply a manual **recipients** list `[{name, email, phone}]`.
    - Use `{name}` in body for per-recipient personalisation.
    - Returns immediately; delivery happens in the background via Amazon SES (email) / Telnyx (SMS).
    """
    if not data.event_id and not data.recipients:
        raise HTTPException(
            status_code=400,
            detail="Provide either event_id (to message all invitees) or a recipients list.",
        )
    try:
        return service.bulk_send(
            user_id=current_user["sub"],
            event_id=data.event_id,
            recipients=data.recipients,
            channel=data.channel,
            subject=data.subject,
            body=data.body,
            background_tasks=background_tasks,
        )
    except ValueError as e:
        raise HTTPException(status_code=404 if "Event not found" in str(e) else 400, detail=str(e))


@router.get("")
def list_notifications(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    return service.list_notifications(current_user["sub"], limit=limit, offset=offset)
