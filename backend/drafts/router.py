from fastapi import APIRouter, Depends
from middleware.auth import get_current_user
from drafts.schemas import DraftUpsertRequest, DraftResponse
from drafts import service

router = APIRouter(prefix="/drafts", tags=["drafts"])


@router.get("/my", response_model=DraftResponse | None)
def get_my_draft(current_user: dict = Depends(get_current_user)):
    return service.get_draft(current_user["sub"])


@router.post("/my/claim-resume", response_model=DraftResponse | None)
def claim_resume_draft(current_user: dict = Depends(get_current_user)):
    return service.claim_resume_draft(current_user["sub"])


@router.post("/my/mark-closed", status_code=204)
def mark_draft_closed(data: DraftUpsertRequest | None = None, current_user: dict = Depends(get_current_user)):
    service.mark_draft_closed(current_user["sub"], data.model_dump() if data else None)


@router.put("/my", response_model=DraftResponse)
def save_my_draft(data: DraftUpsertRequest, current_user: dict = Depends(get_current_user)):
    return service.upsert_draft(current_user["sub"], data.model_dump())


@router.delete("/my", status_code=204)
def delete_my_draft(current_user: dict = Depends(get_current_user)):
    service.delete_draft(current_user["sub"])
