"""
Admin module — design annotation pipeline.

Self-contained module. To remove entirely:
  1. Delete this folder (backend/admin/)
  2. Remove the two lines referencing it from backend/main.py

This module deliberately returns 404 (not 401/403) to unauthenticated callers,
so its existence cannot be detected by probing the URL.
"""
from fastapi import APIRouter, Depends, Header, HTTPException, Response, status
from config import settings
from admin.schemas import (
    LLMSuggestRequest,
    LLMSuggestResponse,
    LayoutsResponse,
    SaveLayoutRequest,
    TemplateLayout,
)
from admin import service, llm

# Two routers:
#   - admin_router (prefix /_studio/api): hidden, write access, secret-gated
#   - public_router (prefix /templates): public-readable layouts, no auth
admin_router = APIRouter(prefix="/_studio/api", tags=["_studio"], include_in_schema=False)
public_router = APIRouter(prefix="/templates", tags=["templates"])


def _stealth_admin_check(x_admin_secret: str | None) -> None:
    """Validate admin secret. Returns 404 (not 403) on failure to hide existence."""
    if not settings.admin_secret:
        # Module is enabled but no secret configured → behave as if it doesn't exist
        raise HTTPException(status_code=404, detail="Not Found")
    if x_admin_secret != settings.admin_secret:
        raise HTTPException(status_code=404, detail="Not Found")


def _admin_dep(x_admin_secret: str | None = Header(default=None)) -> None:
    """Dependency form of the stealth check.

    Dependencies are resolved BEFORE Pydantic body validation, so endpoints
    that take a request body still return 404 on missing/wrong secret instead
    of leaking a 422.
    """
    _stealth_admin_check(x_admin_secret)


# ── Admin endpoints (hidden, write) ──────────────────────────────────────

@admin_router.post("/auth/verify")
def verify_admin(x_admin_secret: str | None = Header(default=None)):
    """Probe endpoint for the frontend secret gate. 404 on bad secret."""
    _stealth_admin_check(x_admin_secret)
    return {"ok": True}


@admin_router.get("/layouts", response_model=LayoutsResponse)
def list_all_layouts(x_admin_secret: str | None = Header(default=None)):
    _stealth_admin_check(x_admin_secret)
    return {"layouts": service.list_layouts()}


@admin_router.get("/layouts/{template_id}", response_model=TemplateLayout)
def get_layout(template_id: str, x_admin_secret: str | None = Header(default=None)):
    _stealth_admin_check(x_admin_secret)
    layout = service.get_layout(template_id)
    if not layout:
        raise HTTPException(status_code=404, detail="Layout not found")
    return layout


@admin_router.put(
    "/layouts/{template_id}",
    response_model=TemplateLayout,
    dependencies=[Depends(_admin_dep)],
)
def save_layout(template_id: str, payload: SaveLayoutRequest):
    return service.save_layout(template_id, payload)


@admin_router.delete("/layouts/{template_id}", status_code=204)
def delete_layout(template_id: str, x_admin_secret: str | None = Header(default=None)):
    _stealth_admin_check(x_admin_secret)
    if not service.delete_layout(template_id):
        raise HTTPException(status_code=404, detail="Layout not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@admin_router.post(
    "/llm/suggest",
    response_model=LLMSuggestResponse,
    dependencies=[Depends(_admin_dep)],
)
async def llm_suggest(req: LLMSuggestRequest):
    try:
        if req.provider == "anthropic":
            if not req.api_key:
                raise HTTPException(status_code=400, detail="api_key required for anthropic")
            text = await llm.suggest_with_anthropic(req.api_key, req.image_url, req.prompt)
        elif req.provider == "ollama":
            text = await llm.suggest_with_ollama(req.ollama_url, req.image_url, req.prompt)
        else:
            raise HTTPException(status_code=400, detail=f"unsupported provider: {req.provider}")
    except HTTPException:
        raise
    except Exception as e:
        # Surface the error message but not the stack trace to the client.
        raise HTTPException(status_code=502, detail=f"LLM call failed: {type(e).__name__}: {e}")
    return LLMSuggestResponse(text=text)


# ── Public endpoint (read-only, used by the live preview) ────────────────

@public_router.get("/layouts", response_model=LayoutsResponse)
def public_layouts():
    """Public read of all saved layouts. Used by the evite preview to position text."""
    return {"layouts": service.list_layouts()}
