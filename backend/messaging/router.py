from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from middleware.auth import get_current_user
from middleware.ratelimit import ip_limit, user_limit
from messaging.schemas import SendMessageRequest
from messaging import service

router = APIRouter(prefix="/messaging", tags=["messaging"])


def _uuid_or_404(value: str, what: str) -> str:
    try:
        return str(UUID(value))
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(status_code=404, detail=f"{what} not found")


@router.get("/events/{event_id}/messages")
def get_messages(
    event_id: str,
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    try:
        return service.list_messages(current_user["sub"], event_id, limit=limit, offset=offset)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/events/{event_id}/messages", dependencies=[Depends(user_limit("organiser-msg", 30, 60))])
def send_message(
    event_id: str,
    data: SendMessageRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        return service.send_organiser_message(
            user_id=current_user["sub"],
            event_id=event_id,
            sender_name=data.sender_name or current_user.get("email", ""),
            body=data.body,
        )
    except ValueError as e:
        raise HTTPException(status_code=400 if "empty" in str(e) else 404, detail=str(e))


@router.post(
    "/events/{event_id}/messages/guest/{invitee_id}",
    dependencies=[Depends(ip_limit("guest-msg", 10, 60))],
)
def send_guest_message(event_id: str, invitee_id: str, data: SendMessageRequest):
    """Public endpoint — guest replies from RSVP page, no auth required."""
    event_id = _uuid_or_404(event_id, "Event")
    invitee_id = _uuid_or_404(invitee_id, "Invitee")
    try:
        return service.send_guest_message(
            event_id=event_id,
            invitee_id=invitee_id,
            sender_name=data.sender_name or "",
            body=data.body,
        )
    except ValueError as e:
        raise HTTPException(status_code=400 if "empty" in str(e) else 404, detail=str(e))
