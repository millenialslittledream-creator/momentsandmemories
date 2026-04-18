from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from middleware.logging import LoggingMiddleware

app = FastAPI(title="Moments & Memories API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(LoggingMiddleware)


@app.get("/health")
def health():
    return {"status": "ok"}
