from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from uuid import UUID
from public.schemas import RSVPRequest
from public import service
from gallery import service as gallery_service
from middleware.ratelimit import ip_limit

router = APIRouter(prefix="/public", tags=["public"], dependencies=[Depends(ip_limit("public", 240, 60))])


def _validated_uuid(value: str, resource: str) -> str:
    """Reject malformed public IDs before they reach Supabase UUID columns."""
    try:
        return str(UUID(value))
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(status_code=404, detail=f"{resource} not found")


@router.get("/events/{event_id}")
def get_public_event(event_id: str):
    event_id = _validated_uuid(event_id, "Event")
    try:
        return service.get_public_event(event_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/websites/{slug}")
def get_public_website(slug: str):
    try:
        return service.get_public_website(slug)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/premium-sites/{slug}")
def get_public_premium_site(slug: str):
    try:
        return service.get_public_premium_site(slug)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/events/{event_id}/book")
def get_public_book(event_id: str):
    event_id = _validated_uuid(event_id, "Event")
    try:
        return service.get_public_book(event_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/events/{event_id}/gallery")
def list_gallery_photos(event_id: str):
    event_id = _validated_uuid(event_id, "Event")
    try:
        return gallery_service.list_approved_photos(event_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/events/{event_id}/gallery", dependencies=[Depends(ip_limit("gallery-upload", 10, 60))])
async def upload_gallery_photo(
    event_id: str,
    file: UploadFile = File(...),
    uploaded_by_name: str = Form(None, max_length=100),
):
    event_id = _validated_uuid(event_id, "Event")
    try:
        content = await file.read(gallery_service.MAX_IMAGE_BYTES + 1)
        return gallery_service.upload_guest_photo(event_id, uploaded_by_name, file.filename, content, file.content_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/events/{event_id}/rsvp/{invitee_id}")
def get_rsvp_page(event_id: str, invitee_id: str):
    event_id = _validated_uuid(event_id, "Event")
    invitee_id = _validated_uuid(invitee_id, "Invitee")
    try:
        event = service.get_public_event(event_id)
        invitee = service.get_invitee_for_rsvp(event_id, invitee_id)
        return {"event": event, "invitee": invitee}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/events/{event_id}/rsvp/{invitee_id}", dependencies=[Depends(ip_limit("rsvp", 30, 60))])
def submit_rsvp(event_id: str, invitee_id: str, data: RSVPRequest):
    event_id = _validated_uuid(event_id, "Event")
    invitee_id = _validated_uuid(invitee_id, "Invitee")
    try:
        return service.submit_rsvp(
            event_id, invitee_id,
            data.status,
            data.message or "",
            data.dietary_requirements or "",
            data.party_size,
            data.kids_count,
            data.food_preference,
            data.adults_count,
            data.children_count,
            data.meal_preferences,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
