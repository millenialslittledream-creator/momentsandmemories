from fastapi import APIRouter, Depends, HTTPException
from middleware.auth import get_current_user
from premium_websites.schemas import CreatePremiumSiteRequest, UpdatePremiumSiteRequest
from premium_websites import service

router = APIRouter(prefix="/premium-websites", tags=["premium-websites"])


@router.post("")
def create_site(data: CreatePremiumSiteRequest, current_user: dict = Depends(get_current_user)):
    try:
        return service.create_premium_site(current_user["sub"], data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("")
def list_sites(current_user: dict = Depends(get_current_user)):
    return service.list_premium_sites(current_user["sub"])


@router.get("/{site_id}")
def get_site(site_id: str, current_user: dict = Depends(get_current_user)):
    try:
        return service.get_premium_site(current_user["sub"], site_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{site_id}")
def update_site(site_id: str, data: UpdatePremiumSiteRequest, current_user: dict = Depends(get_current_user)):
    try:
        return service.update_premium_site(current_user["sub"], site_id, data)
    except ValueError as e:
        status_code = 400 if "taken" in str(e) else 404
        raise HTTPException(status_code=status_code, detail=str(e))


@router.delete("/{site_id}")
def delete_site(site_id: str, current_user: dict = Depends(get_current_user)):
    try:
        service.delete_premium_site(current_user["sub"], site_id)
        return {"status": "deleted"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
