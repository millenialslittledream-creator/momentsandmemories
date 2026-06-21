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
from public.router import router as public_router
from admin.router import router as admin_router
from messaging.router import router as messaging_router
from media.router import router as media_router
from custom_templates.router import router as custom_templates_router
from event_websites.router import router as event_websites_router
from invitation_books.router import router as invitation_books_router
from gallery.router import router as gallery_router
from evite_customizations.router import router as evite_customizations_router

app = FastAPI(title="Moments & Memories API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_origin_regex=r"http://localhost:\d+",
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
app.include_router(public_router)
app.include_router(admin_router)
app.include_router(messaging_router)
app.include_router(media_router)
app.include_router(custom_templates_router)
app.include_router(event_websites_router)
app.include_router(invitation_books_router)
app.include_router(gallery_router)
app.include_router(evite_customizations_router)


@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
