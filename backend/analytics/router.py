from fastapi import APIRouter, Depends
from middleware.auth import require_admin
from analytics import service

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard")
def dashboard(_: None = Depends(require_admin)):
    return service.get_dashboard()


@router.get("/logs")
def recent_logs(limit: int = 100, _: None = Depends(require_admin)):
    return service.get_recent_logs(limit)


@router.get("/users/growth")
def user_growth(days: int = 30, _: None = Depends(require_admin)):
    return service.get_user_growth(days)


@router.get("/orders/stats")
def order_stats(days: int = 30, _: None = Depends(require_admin)):
    return service.get_order_stats(days)
