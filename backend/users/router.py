from fastapi import APIRouter, Depends, HTTPException
from middleware.auth import get_current_user
from users.schemas import UserProfile, UpdateProfileRequest
from users import service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserProfile)
def get_me(current_user: dict = Depends(get_current_user)):
    try:
        return service.get_profile(current_user["sub"])
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/me")
def update_me(
    data: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user),
):
    return service.update_profile(current_user["sub"], data.model_dump())
