from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from public.schemas import RSVPRequest
from public import service
from gallery import service as gallery_service

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/events/{event_id}")
def get_public_event(event_id: str):
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


@router.get("/events/{event_id}/book")
def get_public_book(event_id: str):
    try:
        return service.get_public_book(event_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/events/{event_id}/gallery")
def list_gallery_photos(event_id: str):
    try:
        return gallery_service.list_approved_photos(event_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/events/{event_id}/gallery")
async def upload_gallery_photo(
    event_id: str,
    file: UploadFile = File(...),
    uploaded_by_name: str = Form(None),
):
    try:
        content = await file.read()
        return gallery_service.upload_guest_photo(event_id, uploaded_by_name, file.filename, content, file.content_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


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
