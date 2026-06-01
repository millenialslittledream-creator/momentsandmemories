from fastapi import APIRouter, HTTPException
from public.schemas import RSVPRequest
from public import service

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/events/{event_id}")
def get_public_event(event_id: str):
    try:
        return service.get_public_event(event_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/events/{event_id}/rsvp/{invitee_id}")
def get_rsvp_page(event_id: str, invitee_id: str):
    try:
        event = service.get_public_event(event_id)
        invitee = service.get_invitee_for_rsvp(event_id, invitee_id)
        return {"event": event, "invitee": invitee}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/events/{event_id}/rsvp/{invitee_id}")
def submit_rsvp(event_id: str, invitee_id: str, data: RSVPRequest):
    try:
        return service.submit_rsvp(
            event_id, invitee_id,
            data.status,
            data.message or "",
            data.dietary_requirements or "",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
