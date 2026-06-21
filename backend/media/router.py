from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from middleware.auth import get_current_user
from media import service

router = APIRouter(prefix="/media", tags=["media"])


@router.post("/upload")
async def upload(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    try:
        content = await file.read()
        return service.upload_media(current_user["sub"], file.filename, content, file.content_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("")
def list_uploads(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    return service.list_media(current_user["sub"], limit=limit, offset=offset)


@router.delete("/{media_id}")
def delete(media_id: str, current_user: dict = Depends(get_current_user)):
    try:
        service.delete_media(current_user["sub"], media_id)
        return {"status": "deleted"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
