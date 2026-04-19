from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_users: int
    total_events: int
    total_orders: int
    total_revenue: float
    pending_orders: int
    notifications_sent: int
    notifications_failed: int
