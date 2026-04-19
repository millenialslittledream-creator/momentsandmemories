from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from middleware.logging import LoggingMiddleware
from auth.router import router as auth_router
from users.router import router as users_router
from events.router import router as events_router
from qr.router import router as qr_router

app = FastAPI(title="Moments & Memories API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(LoggingMiddleware)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(events_router)
app.include_router(qr_router)


@app.get("/health")
def health():
    return {"status": "ok"}
