from fastapi import APIRouter, HTTPException
from auth.schemas import (
    SignupRequest, LoginRequest, TokenResponse,
    OTPVerifyRequest, ForgotPasswordRequest, ResetPasswordRequest,
)
from auth import service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", status_code=201)
def signup(data: SignupRequest):
    try:
        return service.signup(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(data: OTPVerifyRequest):
    try:
        return service.verify_otp(data.email, data.otp_code)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest):
    try:
        return service.login(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest):
    return service.forgot_password(data.email)


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest):
    try:
        return service.reset_password(data.token, data.new_password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
