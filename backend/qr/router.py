from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pathlib import Path
from middleware.auth import get_current_user
from qr.schemas import ContactsSubmitRequest, QRSessionResponse
from qr import service
from middleware.ratelimit import ip_limit, user_limit

router = APIRouter(prefix="/qr", tags=["qr"])
templates = Jinja2Templates(directory=str(Path(__file__).parent / "templates"))


@router.post(
    "/session",
    response_model=QRSessionResponse,
    dependencies=[Depends(user_limit("qr-session", 20, 60))],
)
def create_session(
    event_id: str | None = None,
    current_user: dict = Depends(get_current_user),
):
    try:
        return service.create_qr_session(current_user["sub"], event_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/session/{token}")
def poll_session(token: str, current_user: dict = Depends(get_current_user)):
    try:
        return service.get_session_status(current_user["sub"], token)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/import/{token}", response_class=HTMLResponse)
def mobile_import_page(token: str, request: Request):
    api_base = str(request.base_url).rstrip("/") + "/api"
    return templates.TemplateResponse(
        "contact_import.html",
        {"request": request, "token": token, "api_base": api_base},
    )


@router.get("/status/{token}")
def session_status_public(token: str):
    """Public endpoint — mobile page checks this to show expired/completed state."""
    try:
        return service.get_session_status_public(token)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/contacts/{token}", dependencies=[Depends(ip_limit("qr-contacts", 20, 60))])
def submit_contacts(token: str, data: ContactsSubmitRequest):
    try:
        contacts = [c.model_dump(exclude_none=True) for c in data.contacts]
        return service.submit_contacts(token, contacts)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/import/{token}/vcf", dependencies=[Depends(ip_limit("qr-vcf", 10, 60))])
async def submit_vcf(token: str, file: UploadFile = File(...)):
    try:
        contents = await file.read(service.MAX_VCF_BYTES + 1)
        return service.submit_vcf(token, contents)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
