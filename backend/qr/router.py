from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pathlib import Path
from middleware.auth import get_current_user
from qr.schemas import ContactsSubmitRequest, QRSessionResponse
from qr import service

router = APIRouter(prefix="/qr", tags=["qr"])
templates = Jinja2Templates(directory=str(Path(__file__).parent / "templates"))


@router.post("/session", response_model=QRSessionResponse)
def create_session(
    event_id: str | None = None,
    current_user: dict = Depends(get_current_user),
):
    return service.create_qr_session(current_user["sub"], event_id)


@router.get("/session/{token}")
def poll_session(token: str, current_user: dict = Depends(get_current_user)):
    try:
        return service.get_session_status(token)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/import/{token}", response_class=HTMLResponse)
def mobile_import_page(token: str, request: Request):
    api_base = str(request.base_url).rstrip("/")
    return templates.TemplateResponse(
        "contact_import.html",
        {"request": request, "token": token, "api_base": api_base},
    )


@router.post("/contacts/{token}")
def submit_contacts(token: str, data: ContactsSubmitRequest):
    try:
        contacts = [c.model_dump(exclude_none=True) for c in data.contacts]
        return service.submit_contacts(token, contacts)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
