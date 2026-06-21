from fastapi import APIRouter, Depends, HTTPException, Query
from middleware.auth import get_current_user
from custom_templates.schemas import CreateUserTemplateRequest, UpdateUserTemplateRequest
from custom_templates import service

router = APIRouter(prefix="/custom-templates", tags=["custom-templates"])


@router.post("")
def create_template(data: CreateUserTemplateRequest, current_user: dict = Depends(get_current_user)):
    return service.create_user_template(current_user["sub"], data)


@router.get("")
def list_templates(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    return service.list_user_templates(current_user["sub"], limit=limit, offset=offset)


@router.get("/{template_id}")
def get_template(template_id: str, current_user: dict = Depends(get_current_user)):
    try:
        return service.get_user_template(current_user["sub"], template_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{template_id}")
def update_template(
    template_id: str,
    data: UpdateUserTemplateRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        return service.update_user_template(current_user["sub"], template_id, data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{template_id}")
def delete_template(template_id: str, current_user: dict = Depends(get_current_user)):
    try:
        service.delete_user_template(current_user["sub"], template_id)
        return {"status": "deleted"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
