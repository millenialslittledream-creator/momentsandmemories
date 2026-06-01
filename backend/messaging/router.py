from fastapi import APIRouter, Depends, HTTPException, Query
from middleware.auth import get_current_user
from messaging.schemas import SendMessageRequest
from messaging import service

router = APIRouter(prefix="/messaging", tags=["messaging"])


@router.get("/events/{event_id}/messages")
def get_messages(
    event_id: str,
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    return service.list_messages(event_id, limit=limit, offset=offset)


@router.post("/events/{event_id}/messages")
def send_message(
    event_id: str,
    data: SendMessageRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        return service.send_message(
            event_id=event_id,
            sender_id=current_user["sub"],
            sender_type="organiser",
            sender_name=data.sender_name or current_user.get("email", ""),
            body=data.body,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/events/{event_id}/messages/guest/{invitee_id}")
def send_guest_message(event_id: str, invitee_id: str, data: SendMessageRequest):
    """Public endpoint — guest replies from RSVP page, no auth required."""
    try:
        return service.send_message(
            event_id=event_id,
            sender_id=invitee_id,
            sender_type="guest",
            sender_name=data.sender_name or "Guest",
            body=data.body,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
