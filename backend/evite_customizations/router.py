from fastapi import APIRouter, Depends, HTTPException
from middleware.auth import get_current_user
from evite_customizations.schemas import (
    CreateEviteCustomizationRequest,
    UpdateEviteCustomizationRequest,
)
from evite_customizations import service

router = APIRouter(prefix="/evite-customizations", tags=["evite-customizations"])


@router.post("")
def create_customization(
    data: CreateEviteCustomizationRequest, current_user: dict = Depends(get_current_user)
):
    try:
        return service.create_evite_customization(current_user["sub"], data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/by-event/{event_id}")
def list_by_event(event_id: str, current_user: dict = Depends(get_current_user)):
    try:
        return service.get_evite_customizations_by_event(current_user["sub"], event_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{customization_id}")
def get_customization(customization_id: str, current_user: dict = Depends(get_current_user)):
    try:
        return service.get_evite_customization(current_user["sub"], customization_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{customization_id}")
def update_customization(
    customization_id: str,
    data: UpdateEviteCustomizationRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        return service.update_evite_customization(current_user["sub"], customization_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400 if "Event not found" in str(e) else 404, detail=str(e))


@router.delete("/{customization_id}")
def delete_customization(customization_id: str, current_user: dict = Depends(get_current_user)):
    try:
        service.delete_evite_customization(current_user["sub"], customization_id)
        return {"status": "deleted"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
