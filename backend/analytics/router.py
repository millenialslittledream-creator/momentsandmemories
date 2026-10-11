from fastapi import APIRouter, Depends, Query
from middleware.auth import require_admin
from analytics import service

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard")
def dashboard(_: None = Depends(require_admin)):
    return service.get_dashboard()


@router.get("/logs")
def recent_logs(limit: int = Query(100, ge=1, le=500), _: None = Depends(require_admin)):
    return service.get_recent_logs(limit)


@router.get("/users/growth")
def user_growth(days: int = Query(30, ge=1, le=365), _: None = Depends(require_admin)):
    return service.get_user_growth(days)


@router.get("/orders/stats")
def order_stats(days: int = Query(30, ge=1, le=365), _: None = Depends(require_admin)):
    return service.get_order_stats(days)
