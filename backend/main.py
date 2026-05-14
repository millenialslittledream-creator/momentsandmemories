from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from middleware.logging import LoggingMiddleware
from auth.router import router as auth_router
from users.router import router as users_router
from events.router import router as events_router
from qr.router import router as qr_router
from shop.router import router as shop_router
from notifications.router import router as notifications_router
from analytics.router import router as analytics_router
from drafts.router import router as drafts_router
# admin module (removable — delete folder + these two lines)
from admin.router import admin_router, public_router as templates_public_router

app = FastAPI(title="Moments & Memories API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "X-Admin-Secret"],
)
app.add_middleware(LoggingMiddleware)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(events_router)
app.include_router(qr_router)
app.include_router(shop_router)
app.include_router(notifications_router)
app.include_router(analytics_router)
app.include_router(drafts_router)
# admin module (removable)
app.include_router(admin_router)
app.include_router(templates_public_router)


@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
