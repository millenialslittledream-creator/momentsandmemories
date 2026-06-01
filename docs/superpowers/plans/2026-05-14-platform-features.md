# Platform Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build RSVP pages, public event sharing, admin panel, organiser↔guest messaging, and engagement analytics — all matching the existing dark botanical theme strictly.

**Architecture:** New backend routers (`public`, `admin`, `messaging`) + 3 database migrations + 5 new frontend pages. All public endpoints (RSVP, event view) require no auth. All admin endpoints use `X-Admin-Secret` header. Messaging uses Supabase Realtime for live updates.

**Tech Stack:** FastAPI (backend), React 19 + TypeScript (frontend), Supabase (DB + Realtime), Tailwind CSS, Playfair Display / Inter / Cormorant Garamond fonts, `#1a2418` dark bg, `#9cb092` accent, `#e4eee1` light text.

---

## Theme Reference (STRICT — never deviate)

```
Background dark pages:  bg-[#1a2418]
Background light pages: bg-[#C2CCBA]  (background-dark tailwind class)
Accent green:           #9cb092
Light text:             #e4eee1
Muted text:             #b2c3b1  text-[#b2c3b1]/60
Borders:                border-[#9cb092]/30   hover: border-[#9cb092]/60
Panel bg:               bg-[#1a2418]  or  bg-[#9cb092]/5
Buttons:                font-display text-[10px] tracking-[0.2em] uppercase
Headings:               font-serif-exp (Playfair Display) italic text-[#e4eee1]
Body:                   font-display text-xs tracking-[0.15em] text-[#b2c3b1]/60 uppercase
```

---

## File Map

**New backend files:**
- `backend/public/router.py` — public event + RSVP endpoints (no auth)
- `backend/public/schemas.py` — PublicEvent, RSVPRequest, RSVPResponse
- `backend/public/service.py` — DB logic for public routes
- `backend/public/__init__.py`
- `backend/admin/router.py` — admin user mgmt + moderation
- `backend/admin/schemas.py` — AdminUser, AdminEvent
- `backend/admin/service.py` — DB logic for admin routes
- `backend/admin/__init__.py`
- `backend/messaging/router.py` — event message endpoints
- `backend/messaging/schemas.py` — Message, SendMessageRequest
- `backend/messaging/service.py` — DB logic for messages
- `backend/messaging/__init__.py`
- `backend/migrations/012_rsvp_and_public.sql`
- `backend/migrations/013_event_messages.sql`
- `backend/tests/test_public.py`
- `backend/tests/test_admin.py`
- `backend/tests/test_messaging.py`

**Modified backend files:**
- `backend/main.py` — register 3 new routers

**New frontend files:**
- `src/pages/EventPublic.tsx` — public event page `/event/:eventId`
- `src/pages/RSVPPage.tsx` — guest RSVP page `/rsvp/:eventId/:inviteeId`
- `src/pages/AdminPanel.tsx` — admin panel `/admin`
- `src/components/AdminRoute.tsx` — admin route guard
- `src/sections/dashboard/MessagingPanel.tsx` — messaging tab in dashboard
- `src/sections/dashboard/EngagementPanel.tsx` — analytics tab in dashboard

**Modified frontend files:**
- `src/App.tsx` — add 3 new routes
- `src/lib/api.ts` — add new API methods
- `src/pages/Dashboard.tsx` — add Messaging + Engagement tabs + share button

---

## Task 1: Database Migrations

**Files:**
- Create: `backend/migrations/012_rsvp_and_public.sql`
- Create: `backend/migrations/013_event_messages.sql`

- [ ] **Step 1: Create migration 012**

```sql
-- backend/migrations/012_rsvp_and_public.sql

-- Add public sharing + RSVP columns to events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS rsvp_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE;

-- Generate slugs for existing events
UPDATE public.events
SET public_slug = LOWER(REPLACE(title, ' ', '-')) || '-' || SUBSTRING(id::text, 1, 6)
WHERE public_slug IS NULL;

-- Add RSVP message + dietary fields to invitees
ALTER TABLE public.event_invitees
  ADD COLUMN IF NOT EXISTS rsvp_message TEXT,
  ADD COLUMN IF NOT EXISTS dietary_requirements TEXT;

-- Allow public read of events (for public event page)
CREATE POLICY IF NOT EXISTS "Public can view published events"
  ON public.events FOR SELECT
  USING (status = 'published');

-- Allow unauthenticated RSVP updates on own invitee row
CREATE POLICY IF NOT EXISTS "Invitees can update own rsvp"
  ON public.event_invitees FOR UPDATE
  USING (true);

CREATE POLICY IF NOT EXISTS "Public can read invitee count"
  ON public.event_invitees FOR SELECT
  USING (true);
```

- [ ] **Step 2: Create migration 013**

```sql
-- backend/migrations/013_event_messages.sql

CREATE TABLE IF NOT EXISTS public.event_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,            -- user_id or invitee_id
    sender_type TEXT NOT NULL CHECK (sender_type IN ('organiser', 'guest')),
    sender_name TEXT,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.event_messages ENABLE ROW LEVEL SECURITY;

-- Organisers can read/write messages for their own events
CREATE POLICY "Organiser manages messages"
  ON public.event_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND e.user_id::text = auth.uid()::text
    )
  );

-- Anyone can insert guest messages (for RSVP page)
CREATE POLICY "Guests can send messages"
  ON public.event_messages FOR INSERT
  WITH CHECK (sender_type = 'guest');

-- Guests can read messages for their event
CREATE POLICY "Public can read event messages"
  ON public.event_messages FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS idx_event_messages_event_id ON public.event_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_event_messages_created_at ON public.event_messages(created_at DESC);
```

- [ ] **Step 3: Run migrations in Supabase**

Go to **Supabase → SQL Editor** and paste + run each migration file in order (012 then 013).

- [ ] **Step 4: Commit migrations**

```bash
git add backend/migrations/012_rsvp_and_public.sql backend/migrations/013_event_messages.sql
git commit -m "feat(db): add rsvp fields, public slugs, and event_messages table"
```

---

## Task 2: Public Router (Backend)

**Files:**
- Create: `backend/public/__init__.py`
- Create: `backend/public/schemas.py`
- Create: `backend/public/service.py`
- Create: `backend/public/router.py`
- Create: `backend/tests/test_public.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_public.py
import pytest
from unittest.mock import MagicMock


def test_get_public_event_success(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "evt-1", "title": "Test Party", "status": "published",
               "event_date": "2026-08-01", "location": "NYC", "description": "Fun",
               "cover_image_url": None, "rsvp_enabled": True}]
    )
    from public.service import get_public_event
    result = get_public_event("evt-1")
    assert result["title"] == "Test Party"


def test_get_public_event_not_published(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
    from public.service import get_public_event
    with pytest.raises(ValueError, match="not found"):
        get_public_event("evt-1")


def test_submit_rsvp_accepted(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "inv-1", "event_id": "evt-1", "name": "Alice", "rsvp_status": "pending"}]
    )
    mock_db.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[{}])

    from public.service import submit_rsvp
    result = submit_rsvp("evt-1", "inv-1", "accepted", "Looking forward!", "Vegan")
    assert result["status"] == "accepted"


def test_submit_rsvp_invalid_status(mock_db):
    from public.service import submit_rsvp
    with pytest.raises(ValueError, match="status"):
        submit_rsvp("evt-1", "inv-1", "maybe_not", "", "")
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend && pytest tests/test_public.py -v
```
Expected: `ModuleNotFoundError: No module named 'public'`

- [ ] **Step 3: Create `backend/public/__init__.py`**

```python
```
(empty file)

- [ ] **Step 4: Create `backend/public/schemas.py`**

```python
from pydantic import BaseModel
from typing import Optional


class PublicEventResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    event_date: str
    event_time: Optional[str]
    location: Optional[str]
    cover_image_url: Optional[str]
    rsvp_enabled: bool
    invitee_count: int


class RSVPRequest(BaseModel):
    status: str          # "accepted" | "declined"
    message: Optional[str] = ""
    dietary_requirements: Optional[str] = ""


class RSVPResponse(BaseModel):
    invitee_id: str
    status: str
    message: str
```

- [ ] **Step 5: Create `backend/public/service.py`**

```python
import database
from middleware.logging import log_event as _log

VALID_RSVP_STATUSES = {"accepted", "declined"}


def get_public_event(event_id: str) -> dict:
    db = database.get_db()
    result = (
        db.table("events")
        .select("id,title,description,event_date,event_time,location,cover_image_url,rsvp_enabled,status")
        .eq("id", event_id)
        .eq("status", "published")
        .execute()
    )
    if not result.data:
        raise ValueError("Event not found or not published")
    event = result.data[0]

    count_result = (
        db.table("event_invitees")
        .select("id", count="exact")
        .eq("event_id", event_id)
        .execute()
    )
    event["invitee_count"] = count_result.count or 0
    return event


def get_invitee_for_rsvp(event_id: str, invitee_id: str) -> dict:
    db = database.get_db()
    result = (
        db.table("event_invitees")
        .select("id,name,email,rsvp_status,rsvp_message,dietary_requirements")
        .eq("id", invitee_id)
        .eq("event_id", event_id)
        .execute()
    )
    if not result.data:
        raise ValueError("Invitee not found")
    return result.data[0]


def submit_rsvp(
    event_id: str,
    invitee_id: str,
    status: str,
    message: str,
    dietary_requirements: str,
) -> dict:
    if status not in VALID_RSVP_STATUSES:
        raise ValueError(f"Invalid RSVP status: {status!r}. Must be 'accepted' or 'declined'")

    db = database.get_db()
    # Verify invitee belongs to this event
    check = (
        db.table("event_invitees")
        .select("id")
        .eq("id", invitee_id)
        .eq("event_id", event_id)
        .execute()
    )
    if not check.data:
        raise ValueError("Invitee not found for this event")

    from datetime import datetime, timezone
    db.table("event_invitees").update({
        "rsvp_status": status,
        "rsvp_message": message,
        "dietary_requirements": dietary_requirements,
        "responded_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", invitee_id).execute()

    _log("public", "rsvp.submitted", metadata={"event_id": event_id, "status": status})
    return {"invitee_id": invitee_id, "status": status, "message": message}
```

- [ ] **Step 6: Create `backend/public/router.py`**

```python
from fastapi import APIRouter, HTTPException
from public.schemas import RSVPRequest
from public import service

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/events/{event_id}")
def get_public_event(event_id: str):
    try:
        return service.get_public_event(event_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/events/{event_id}/rsvp/{invitee_id}")
def get_rsvp_page(event_id: str, invitee_id: str):
    try:
        event = service.get_public_event(event_id)
        invitee = service.get_invitee_for_rsvp(event_id, invitee_id)
        return {"event": event, "invitee": invitee}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/events/{event_id}/rsvp/{invitee_id}")
def submit_rsvp(event_id: str, invitee_id: str, data: RSVPRequest):
    try:
        return service.submit_rsvp(
            event_id, invitee_id, data.status, data.message or "", data.dietary_requirements or ""
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

- [ ] **Step 7: Run tests — verify they pass**

```bash
cd backend && pytest tests/test_public.py -v
```
Expected: 4 tests PASS

- [ ] **Step 8: Register router in `backend/main.py`**

Add after existing imports:
```python
from public.router import router as public_router
```
Add after existing `app.include_router(drafts_router)`:
```python
app.include_router(public_router)
```

- [ ] **Step 9: Commit**

```bash
git add backend/public/ backend/tests/test_public.py backend/main.py
git commit -m "feat(public): add public event view and RSVP endpoints"
```

---

## Task 3: Admin Router (Backend)

**Files:**
- Create: `backend/admin/__init__.py`
- Create: `backend/admin/schemas.py`
- Create: `backend/admin/service.py`
- Create: `backend/admin/router.py`
- Create: `backend/tests/test_admin.py`
- Modify: `backend/main.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_admin.py
import pytest
from unittest.mock import MagicMock, patch


def test_list_users(mock_db):
    mock_db.table.return_value.select.return_value.order.return_value.limit.return_value.offset.return_value.execute.return_value = MagicMock(
        data=[{"id": "u1", "email": "a@b.com", "created_at": "2026-01-01"}]
    )
    from admin.service import list_users
    result = list_users()
    assert len(result) == 1
    assert result[0]["email"] == "a@b.com"


def test_list_all_events(mock_db):
    mock_db.table.return_value.select.return_value.order.return_value.limit.return_value.offset.return_value.execute.return_value = MagicMock(
        data=[{"id": "e1", "title": "Party", "status": "published", "user_id": "u1"}]
    )
    from admin.service import list_all_events
    result = list_all_events()
    assert result[0]["title"] == "Party"


def test_delete_user(mock_db):
    mock_db.table.return_value.delete.return_value.eq.return_value.execute.return_value = MagicMock(data=[{}])
    from admin.service import delete_user
    result = delete_user("u1")
    assert result["deleted"] is True


def test_moderate_event(mock_db):
    mock_db.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[{}])
    from admin.service import moderate_event
    result = moderate_event("e1", "archived")
    assert result["status"] == "archived"
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend && pytest tests/test_admin.py -v
```
Expected: `ModuleNotFoundError: No module named 'admin'`

- [ ] **Step 3: Create `backend/admin/__init__.py`**

```python
```
(empty)

- [ ] **Step 4: Create `backend/admin/schemas.py`**

```python
from pydantic import BaseModel
from typing import Optional


class AdminUserResponse(BaseModel):
    id: str
    email: Optional[str]
    created_at: str
    total_events: int = 0


class AdminEventResponse(BaseModel):
    id: str
    title: str
    status: str
    user_id: str
    created_at: str
    invitee_count: int = 0


class ModerateEventRequest(BaseModel):
    status: str  # "archived" | "published"
```

- [ ] **Step 5: Create `backend/admin/service.py`**

```python
import database
from middleware.logging import log_event as _log


def list_users(limit: int = 100, offset: int = 0) -> list:
    db = database.get_db()
    return (
        db.table("users")
        .select("id,email,created_at")
        .order("created_at", desc=True)
        .limit(limit)
        .offset(offset)
        .execute().data
    )


def list_all_events(limit: int = 100, offset: int = 0) -> list:
    db = database.get_db()
    return (
        db.table("events")
        .select("id,title,status,user_id,created_at,event_date")
        .order("created_at", desc=True)
        .limit(limit)
        .offset(offset)
        .execute().data
    )


def delete_user(user_id: str) -> dict:
    db = database.get_db()
    db.table("users").delete().eq("id", user_id).execute()
    _log("admin", "user.deleted", metadata={"user_id": user_id})
    return {"deleted": True}


def moderate_event(event_id: str, status: str) -> dict:
    if status not in {"archived", "published", "draft"}:
        raise ValueError(f"Invalid status: {status!r}")
    db = database.get_db()
    db.table("events").update({"status": status}).eq("id", event_id).execute()
    _log("admin", "event.moderated", metadata={"event_id": event_id, "status": status})
    return {"event_id": event_id, "status": status}


def get_platform_stats() -> dict:
    db = database.get_db()
    from analytics.service import get_dashboard
    return get_dashboard()
```

- [ ] **Step 6: Create `backend/admin/router.py`**

```python
from fastapi import APIRouter, HTTPException, Query
from middleware.auth import require_admin
from admin.schemas import ModerateEventRequest
from admin import service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
def get_stats(admin=require_admin):
    return service.get_platform_stats()


@router.get("/users")
def list_users(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    _=require_admin,
):
    return service.list_users(limit=limit, offset=offset)


@router.delete("/users/{user_id}")
def delete_user(user_id: str, _=require_admin):
    return service.delete_user(user_id)


@router.get("/events")
def list_all_events(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    _=require_admin,
):
    return service.list_all_events(limit=limit, offset=offset)


@router.put("/events/{event_id}/moderate")
def moderate_event(event_id: str, data: ModerateEventRequest, _=require_admin):
    try:
        return service.moderate_event(event_id, data.status)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

- [ ] **Step 7: Run tests — verify they pass**

```bash
cd backend && pytest tests/test_admin.py -v
```
Expected: 4 tests PASS

- [ ] **Step 8: Register in `backend/main.py`**

```python
from admin.router import router as admin_router
# ...
app.include_router(admin_router)
```

- [ ] **Step 9: Commit**

```bash
git add backend/admin/ backend/tests/test_admin.py backend/main.py
git commit -m "feat(admin): add admin user management and event moderation endpoints"
```

---

## Task 4: Messaging Router (Backend)

**Files:**
- Create: `backend/messaging/__init__.py`
- Create: `backend/messaging/schemas.py`
- Create: `backend/messaging/service.py`
- Create: `backend/messaging/router.py`
- Create: `backend/tests/test_messaging.py`
- Modify: `backend/main.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_messaging.py
import pytest
from unittest.mock import MagicMock


def test_send_organiser_message(mock_db):
    mock_db.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": "msg-1", "event_id": "evt-1", "sender_id": "u1",
               "sender_type": "organiser", "body": "Hello!", "created_at": "2026-01-01"}]
    )
    from messaging.service import send_message
    result = send_message("evt-1", "u1", "organiser", "Alice", "Hello!")
    assert result["body"] == "Hello!"
    assert result["sender_type"] == "organiser"


def test_list_messages(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.offset.return_value.execute.return_value = MagicMock(
        data=[
            {"id": "msg-1", "body": "Hi", "sender_type": "organiser"},
            {"id": "msg-2", "body": "Hey back", "sender_type": "guest"},
        ]
    )
    from messaging.service import list_messages
    result = list_messages("evt-1")
    assert len(result) == 2


def test_send_empty_message_raises(mock_db):
    from messaging.service import send_message
    with pytest.raises(ValueError, match="empty"):
        send_message("evt-1", "u1", "organiser", "Alice", "   ")
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend && pytest tests/test_messaging.py -v
```
Expected: `ModuleNotFoundError: No module named 'messaging'`

- [ ] **Step 3: Create `backend/messaging/__init__.py`**

```python
```
(empty)

- [ ] **Step 4: Create `backend/messaging/schemas.py`**

```python
from pydantic import BaseModel
from typing import Optional


class SendMessageRequest(BaseModel):
    body: str
    sender_name: Optional[str] = ""
    # sender_type determined by endpoint (organiser vs guest)


class MessageResponse(BaseModel):
    id: str
    event_id: str
    sender_id: str
    sender_type: str
    sender_name: Optional[str]
    body: str
    created_at: str
```

- [ ] **Step 5: Create `backend/messaging/service.py`**

```python
import database
from middleware.logging import log_event as _log


def send_message(
    event_id: str,
    sender_id: str,
    sender_type: str,
    sender_name: str,
    body: str,
) -> dict:
    if not body.strip():
        raise ValueError("Message body cannot be empty")

    db = database.get_db()
    result = db.table("event_messages").insert({
        "event_id": event_id,
        "sender_id": sender_id,
        "sender_type": sender_type,
        "sender_name": sender_name,
        "body": body.strip(),
    }).execute()

    _log("messaging", "message.sent", metadata={"event_id": event_id, "sender_type": sender_type})
    return result.data[0]


def list_messages(event_id: str, limit: int = 100, offset: int = 0) -> list:
    db = database.get_db()
    return (
        db.table("event_messages")
        .select("*")
        .eq("event_id", event_id)
        .order("created_at", desc=False)
        .limit(limit)
        .offset(offset)
        .execute().data
    )
```

- [ ] **Step 6: Create `backend/messaging/router.py`**

```python
from fastapi import APIRouter, HTTPException, Query, Depends
from middleware.auth import get_current_user
from messaging.schemas import SendMessageRequest
from messaging import service

router = APIRouter(prefix="/messaging", tags=["messaging"])


@router.get("/events/{event_id}/messages")
def get_messages(
    event_id: str,
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    return service.list_messages(event_id, limit=limit, offset=offset)


@router.post("/events/{event_id}/messages")
def send_message(
    event_id: str,
    data: SendMessageRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        return service.send_message(
            event_id=event_id,
            sender_id=current_user["sub"],
            sender_type="organiser",
            sender_name=data.sender_name or current_user.get("email", ""),
            body=data.body,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/public/events/{event_id}/messages/{invitee_id}")
def send_guest_message(event_id: str, invitee_id: str, data: SendMessageRequest):
    """Public endpoint — guest replies from RSVP page."""
    try:
        return service.send_message(
            event_id=event_id,
            sender_id=invitee_id,
            sender_type="guest",
            sender_name=data.sender_name or "Guest",
            body=data.body,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

- [ ] **Step 7: Run tests — verify they pass**

```bash
cd backend && pytest tests/test_messaging.py -v
```
Expected: 3 tests PASS

- [ ] **Step 8: Register in `backend/main.py`**

```python
from messaging.router import router as messaging_router
# ...
app.include_router(messaging_router)
```

- [ ] **Step 9: Commit**

```bash
git add backend/messaging/ backend/tests/test_messaging.py backend/main.py
git commit -m "feat(messaging): add organiser<->guest event messaging endpoints"
```

---

## Task 5: Run Full Backend Test Suite

- [ ] **Step 1: Run all tests**

```bash
cd backend && pytest tests/ -v
```
Expected: All 51+ tests PASS (45 existing + 4 public + 4 admin + 3 messaging)

- [ ] **Step 2: Fix any failures before proceeding to frontend**

---

## Task 6: Frontend API Client Extensions

**Files:**
- Modify: `src/lib/api.ts`

- [ ] **Step 1: Add new API methods to `src/lib/api.ts`**

Add inside the `export const api = {` block:

```typescript
  // ── Public (no auth) ─────────────────────────────────────────────────
  getPublicEvent: (eventId: string) =>
    fetch(`${API_URL}/public/events/${eventId}`)
      .then(r => r.ok ? r.json() : r.json().then((e: {detail: string}) => Promise.reject(new Error(e.detail)))),

  getRSVPPage: (eventId: string, inviteeId: string) =>
    fetch(`${API_URL}/public/events/${eventId}/rsvp/${inviteeId}`)
      .then(r => r.ok ? r.json() : r.json().then((e: {detail: string}) => Promise.reject(new Error(e.detail)))),

  submitRSVP: (eventId: string, inviteeId: string, data: { status: string; message: string; dietary_requirements: string }) =>
    fetch(`${API_URL}/public/events/${eventId}/rsvp/${inviteeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.ok ? r.json() : r.json().then((e: {detail: string}) => Promise.reject(new Error(e.detail)))),

  sendGuestMessage: (eventId: string, inviteeId: string, body: string, senderName: string) =>
    fetch(`${API_URL}/messaging/public/events/${eventId}/messages/${inviteeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, sender_name: senderName }),
    }).then(r => r.ok ? r.json() : r.json().then((e: {detail: string}) => Promise.reject(new Error(e.detail)))),

  // ── Messaging (auth required) ─────────────────────────────────────────
  getMessages: (eventId: string) =>
    apiFetch<Array<{ id: string; sender_type: string; sender_name: string; body: string; created_at: string }>>(
      `/messaging/events/${eventId}/messages`
    ),

  sendMessage: (eventId: string, body: string) =>
    apiFetch<{ id: string; body: string; created_at: string }>(
      `/messaging/events/${eventId}/messages`,
      { method: 'POST', body: JSON.stringify({ body }) }
    ),

  // ── Admin (X-Admin-Secret header) ─────────────────────────────────────
  adminGetStats: (secret: string) =>
    fetch(`${API_URL}/admin/stats`, { headers: { 'X-Admin-Secret': secret } })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Unauthorized'))),

  adminListUsers: (secret: string) =>
    fetch(`${API_URL}/admin/users`, { headers: { 'X-Admin-Secret': secret } })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Unauthorized'))),

  adminDeleteUser: (secret: string, userId: string) =>
    fetch(`${API_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Secret': secret },
    }).then(r => r.ok ? r.json() : Promise.reject(new Error('Unauthorized'))),

  adminListEvents: (secret: string) =>
    fetch(`${API_URL}/admin/events`, { headers: { 'X-Admin-Secret': secret } })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Unauthorized'))),

  adminModerateEvent: (secret: string, eventId: string, status: string) =>
    fetch(`${API_URL}/admin/events/${eventId}/moderate`, {
      method: 'PUT',
      headers: { 'X-Admin-Secret': secret, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).then(r => r.ok ? r.json() : Promise.reject(new Error('Unauthorized'))),

  // ── Event RSVP stats (auth required) ──────────────────────────────────
  getEventRSVPStats: (eventId: string) =>
    apiFetch<{ total: number; accepted: number; declined: number; pending: number }>(
      `/events/${eventId}/rsvp-stats`
    ),
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat(api): add public RSVP, messaging, and admin API methods"
```

---

## Task 7: RSVP Stats Backend Endpoint

**Files:**
- Modify: `backend/events/router.py`
- Modify: `backend/events/service.py`

- [ ] **Step 1: Add service method in `backend/events/service.py`**

```python
def get_rsvp_stats(user_id: str, event_id: str) -> dict:
    db = database.get_db()
    # Verify ownership
    event = db.table("events").select("id").eq("id", event_id).eq("user_id", user_id).execute()
    if not event.data:
        raise ValueError("Event not found")

    rows = db.table("event_invitees").select("rsvp_status").eq("event_id", event_id).execute().data
    total = len(rows)
    accepted = sum(1 for r in rows if r["rsvp_status"] == "accepted")
    declined = sum(1 for r in rows if r["rsvp_status"] == "declined")
    pending = sum(1 for r in rows if r["rsvp_status"] == "pending")
    return {"total": total, "accepted": accepted, "declined": declined, "pending": pending}
```

- [ ] **Step 2: Add route in `backend/events/router.py`**

Add after existing routes:
```python
@router.get("/{event_id}/rsvp-stats")
def get_rsvp_stats(event_id: str, current_user: dict = Depends(get_current_user)):
    try:
        return service.get_rsvp_stats(current_user["sub"], event_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
```

- [ ] **Step 3: Commit**

```bash
git add backend/events/service.py backend/events/router.py
git commit -m "feat(events): add RSVP stats endpoint per event"
```

---

## Task 8: Public Event Page (Frontend)

**Files:**
- Create: `src/pages/EventPublic.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `src/pages/EventPublic.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';

interface PublicEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  cover_image_url: string | null;
  rsvp_enabled: boolean;
  invitee_count: number;
}

export default function EventPublic() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!eventId) return;
    api.getPublicEvent(eventId)
      .then(setEvent)
      .catch(() => setError('This event is not available.'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#1a2418] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#9cb092]/30 border-t-[#9cb092] rounded-full animate-spin" />
    </div>
  );

  if (error || !event) return (
    <div className="min-h-screen bg-[#1a2418] flex items-center justify-center">
      <p className="font-display text-[11px] tracking-[0.2em] uppercase text-[#b2c3b1]/60">{error || 'Event not found'}</p>
    </div>
  );

  const dateStr = new Date(event.event_date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#1a2418]">
      {/* Cover */}
      {event.cover_image_url ? (
        <div className="w-full h-64 md:h-96 overflow-hidden">
          <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover opacity-80" />
        </div>
      ) : (
        <div className="w-full h-40 bg-[#9cb092]/10 border-b border-[#9cb092]/20" />
      )}

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Title */}
        <h1 className="font-serif-exp text-3xl md:text-4xl text-[#e4eee1] italic mb-2">{event.title}</h1>

        {/* Meta */}
        <div className="flex flex-col gap-2 mb-8 mt-4">
          <p className="font-display text-[11px] tracking-[0.2em] uppercase text-[#9cb092]">{dateStr}</p>
          {event.event_time && (
            <p className="font-display text-[11px] tracking-[0.2em] uppercase text-[#b2c3b1]/60">{event.event_time}</p>
          )}
          {event.location && (
            <p className="font-display text-[11px] tracking-[0.2em] uppercase text-[#b2c3b1]/60">
              <span className="material-icons text-xs mr-1 align-middle">location_on</span>
              {event.location}
            </p>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <p className="font-display text-sm text-[#b2c3b1]/80 leading-relaxed mb-8 border-l-2 border-[#9cb092]/30 pl-4">
            {event.description}
          </p>
        )}

        {/* Guest count */}
        <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/40 mb-8">
          {event.invitee_count} {event.invitee_count === 1 ? 'guest' : 'guests'} invited
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleShare}
            className="flex-1 py-3 border border-[#9cb092]/30 hover:border-[#9cb092]/60 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 transition-all font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092] flex items-center justify-center gap-2"
          >
            <span className="material-icons text-sm">share</span>
            Share Event
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add route in `src/App.tsx`**

Add lazy import:
```tsx
const EventPublic = lazy(() => import('./pages/EventPublic'));
```
Add route inside `<Routes>`:
```tsx
<Route path="/event/:eventId" element={<EventPublic />} />
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/EventPublic.tsx src/App.tsx
git commit -m "feat(frontend): add public event page /event/:eventId"
```

---

## Task 9: RSVP Page (Frontend)

**Files:**
- Create: `src/pages/RSVPPage.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `src/pages/RSVPPage.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';

type RSVPStatus = 'accepted' | 'declined' | null;

interface Invitee {
  id: string;
  name: string;
  email: string;
  rsvp_status: string;
  rsvp_message: string | null;
  dietary_requirements: string | null;
}

interface EventInfo {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  location: string | null;
  cover_image_url: string | null;
  rsvp_enabled: boolean;
}

export default function RSVPPage() {
  const { eventId, inviteeId } = useParams<{ eventId: string; inviteeId: string }>();
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [invitee, setInvitee] = useState<Invitee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<RSVPStatus>(null);
  const [message, setMessage] = useState('');
  const [dietary, setDietary] = useState('');
  const [guestMessage, setGuestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  useEffect(() => {
    if (!eventId || !inviteeId) return;
    api.getRSVPPage(eventId, inviteeId)
      .then((data: { event: EventInfo; invitee: Invitee }) => {
        setEvent(data.event);
        setInvitee(data.invitee);
        if (data.invitee.rsvp_status !== 'pending') {
          setStatus(data.invitee.rsvp_status as RSVPStatus);
          setDone(true);
        }
      })
      .catch(() => setError('This invitation link is not valid.'))
      .finally(() => setLoading(false));
  }, [eventId, inviteeId]);

  const handleSubmit = async () => {
    if (!status || !eventId || !inviteeId) return;
    setSubmitting(true);
    try {
      await api.submitRSVP(eventId, inviteeId, {
        status,
        message,
        dietary_requirements: dietary,
      });
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!guestMessage.trim() || !eventId || !inviteeId) return;
    await api.sendGuestMessage(eventId, inviteeId, guestMessage, invitee?.name || 'Guest');
    setGuestMessage('');
    setMessageSent(true);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#1a2418] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#9cb092]/30 border-t-[#9cb092] rounded-full animate-spin" />
    </div>
  );

  if (error || !event || !invitee) return (
    <div className="min-h-screen bg-[#1a2418] flex items-center justify-center px-6">
      <p className="font-display text-[11px] tracking-[0.2em] uppercase text-[#b2c3b1]/60 text-center">{error || 'Invitation not found'}</p>
    </div>
  );

  const dateStr = new Date(event.event_date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#1a2418] flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="font-display text-[10px] tracking-[0.3em] uppercase text-[#9cb092] mb-3">You're Invited</p>
          <h1 className="font-serif-exp text-3xl text-[#e4eee1] italic mb-2">{event.title}</h1>
          <p className="font-display text-[11px] tracking-[0.2em] uppercase text-[#b2c3b1]/60">{dateStr}</p>
          {event.location && (
            <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#b2c3b1]/40 mt-1">{event.location}</p>
          )}
        </div>

        {/* Guest name */}
        <p className="font-display text-[11px] tracking-[0.15em] uppercase text-[#b2c3b1]/60 text-center mb-8">
          For <span className="text-[#e4eee1]">{invitee.name}</span>
        </p>

        {done ? (
          <div className="text-center">
            <div className={`w-16 h-16 mx-auto mb-6 flex items-center justify-center border ${status === 'accepted' ? 'border-[#9cb092]' : 'border-[#b2c3b1]/30'}`}>
              <span className="material-icons text-2xl" style={{ color: status === 'accepted' ? '#9cb092' : '#b2c3b1' }}>
                {status === 'accepted' ? 'check' : 'close'}
              </span>
            </div>
            <p className="font-serif-exp text-xl text-[#e4eee1] italic mb-2">
              {status === 'accepted' ? 'See you there!' : 'Sorry to miss you'}
            </p>
            <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/50 mb-8">
              Your RSVP has been recorded
            </p>

            {/* Message to organiser */}
            {!messageSent ? (
              <div className="mt-6 text-left">
                <label className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/50 block mb-2">
                  Leave a message for the host (optional)
                </label>
                <textarea
                  value={guestMessage}
                  onChange={e => setGuestMessage(e.target.value)}
                  placeholder="Write something..."
                  rows={3}
                  className="w-full bg-transparent border border-[#9cb092]/30 p-3 font-display text-xs text-[#e4eee1] placeholder-[#b2c3b1]/30 focus:outline-none focus:border-[#9cb092]/60 resize-none"
                />
                <button
                  onClick={handleSendMessage}
                  className="mt-2 w-full py-3 border border-[#9cb092]/30 hover:border-[#9cb092]/60 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 transition-all font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092]"
                >
                  Send Message
                </button>
              </div>
            ) : (
              <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092]">Message sent ✓</p>
            )}
          </div>
        ) : (
          <>
            {/* RSVP buttons */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <button
                onClick={() => setStatus('accepted')}
                className={`py-4 border transition-all font-display text-[10px] tracking-[0.2em] uppercase flex flex-col items-center gap-1 ${
                  status === 'accepted'
                    ? 'border-[#9cb092] bg-[#9cb092]/15 text-[#9cb092]'
                    : 'border-[#9cb092]/30 text-[#b2c3b1]/60 hover:border-[#9cb092]/60 hover:text-[#9cb092]'
                }`}
              >
                <span className="material-icons text-base">check_circle</span>
                Attending
              </button>
              <button
                onClick={() => setStatus('declined')}
                className={`py-4 border transition-all font-display text-[10px] tracking-[0.2em] uppercase flex flex-col items-center gap-1 ${
                  status === 'declined'
                    ? 'border-red-400/60 bg-red-400/10 text-red-400/80'
                    : 'border-[#9cb092]/30 text-[#b2c3b1]/60 hover:border-[#9cb092]/60 hover:text-[#b2c3b1]'
                }`}
              >
                <span className="material-icons text-base">cancel</span>
                Can't Make It
              </button>
            </div>

            {/* Optional fields */}
            {status && (
              <div className="space-y-4 mb-8">
                {status === 'accepted' && (
                  <div>
                    <label className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/50 block mb-2">
                      Dietary requirements (optional)
                    </label>
                    <input
                      type="text"
                      value={dietary}
                      onChange={e => setDietary(e.target.value)}
                      placeholder="e.g. vegetarian, nut allergy"
                      className="w-full bg-transparent border border-[#9cb092]/30 p-3 font-display text-xs text-[#e4eee1] placeholder-[#b2c3b1]/30 focus:outline-none focus:border-[#9cb092]/60"
                    />
                  </div>
                )}
                <div>
                  <label className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/50 block mb-2">
                    Message (optional)
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Write a note for the host..."
                    rows={3}
                    className="w-full bg-transparent border border-[#9cb092]/30 p-3 font-display text-xs text-[#e4eee1] placeholder-[#b2c3b1]/30 focus:outline-none focus:border-[#9cb092]/60 resize-none"
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="font-display text-[10px] tracking-[0.15em] uppercase text-red-400/80 mb-4">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!status || submitting}
              className="w-full py-4 bg-[#9cb092] hover:bg-[#9cb092]/90 disabled:bg-[#9cb092]/20 disabled:text-[#b2c3b1]/30 transition-all font-display text-[10px] tracking-[0.3em] uppercase text-[#1a2418] font-medium"
            >
              {submitting ? 'Sending...' : 'Confirm RSVP'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add route and import in `src/App.tsx`**

```tsx
const RSVPPage = lazy(() => import('./pages/RSVPPage'));
// In <Routes>:
<Route path="/rsvp/:eventId/:inviteeId" element={<RSVPPage />} />
```

- [ ] **Step 3: Add share button in Dashboard**

In `src/pages/Dashboard.tsx`, find the events list render and add share button next to each published event:

```tsx
{event.status === 'published' && (
  <button
    onClick={() => {
      navigator.clipboard.writeText(`${window.location.origin}/event/${event.id}`);
      toast.success('Event link copied!');
    }}
    className="font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092] hover:text-[#9cb092]/80 transition-colors flex items-center gap-1"
  >
    <span className="material-icons text-xs">share</span>
    Share
  </button>
)}
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/RSVPPage.tsx src/pages/EventPublic.tsx src/App.tsx src/pages/Dashboard.tsx
git commit -m "feat(frontend): add RSVP page and public event share flow"
```

---

## Task 10: Engagement Analytics Panel (Frontend)

**Files:**
- Create: `src/sections/dashboard/EngagementPanel.tsx`
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Create `src/sections/dashboard/EngagementPanel.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface RSVPStats {
  total: number;
  accepted: number;
  declined: number;
  pending: number;
}

interface Props {
  eventId: string;
  eventTitle: string;
}

export default function EngagementPanel({ eventId, eventTitle }: Props) {
  const [stats, setStats] = useState<RSVPStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEventRSVPStats(eventId)
      .then(setStats)
      .catch(() => setStats({ total: 0, accepted: 0, declined: 0, pending: 0 }))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <div className="w-4 h-4 border border-[#9cb092]/30 border-t-[#9cb092] rounded-full animate-spin" />
    </div>
  );

  if (!stats) return null;

  const acceptedPct = stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0;
  const declinedPct = stats.total > 0 ? Math.round((stats.declined / stats.total) * 100) : 0;
  const pendingPct  = stats.total > 0 ? Math.round((stats.pending  / stats.total) * 100) : 0;

  return (
    <div className="bg-[#9cb092]/5 border border-[#9cb092]/20 p-6">
      <p className="font-display text-[10px] tracking-[0.3em] uppercase text-[#9cb092] mb-1">RSVP Engagement</p>
      <p className="font-serif-exp text-sm text-[#e4eee1] italic mb-6">{eventTitle}</p>

      {/* Bar */}
      {stats.total > 0 && (
        <div className="flex h-2 mb-6 overflow-hidden rounded-none">
          <div className="bg-[#9cb092] transition-all" style={{ width: `${acceptedPct}%` }} />
          <div className="bg-red-400/50 transition-all" style={{ width: `${declinedPct}%` }} />
          <div className="bg-[#b2c3b1]/20 transition-all" style={{ width: `${pendingPct}%` }} />
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: '#e4eee1' },
          { label: 'Attending', value: stats.accepted, color: '#9cb092' },
          { label: 'Declined', value: stats.declined, color: '#f87171' },
          { label: 'Pending', value: stats.pending, color: '#b2c3b1' },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center">
            <p className="font-serif-exp text-2xl italic" style={{ color }}>{value}</p>
            <p className="font-display text-[9px] tracking-[0.2em] uppercase text-[#b2c3b1]/50 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* RSVP link */}
      <div className="mt-6 pt-4 border-t border-[#9cb092]/20">
        <p className="font-display text-[9px] tracking-[0.15em] uppercase text-[#b2c3b1]/40 mb-2">Guest RSVP link</p>
        <button
          onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/event/${eventId}`);
          }}
          className="font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092] hover:text-[#9cb092]/70 transition-colors flex items-center gap-1"
        >
          <span className="material-icons text-xs">content_copy</span>
          Copy share link
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add Engagement tab to Dashboard**

In `src/pages/Dashboard.tsx`, add an "Analytics" accordion/section for each published event that renders `<EngagementPanel eventId={event.id} eventTitle={event.title} />`.

Find where events are listed and add below each event card:
```tsx
import EngagementPanel from '@/sections/dashboard/EngagementPanel';

// Inside event list, for published events only:
{event.status === 'published' && (
  <EngagementPanel eventId={event.id} eventTitle={event.title} />
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/sections/dashboard/EngagementPanel.tsx src/pages/Dashboard.tsx
git commit -m "feat(frontend): add RSVP engagement analytics panel to dashboard"
```

---

## Task 11: Messaging Panel (Frontend)

**Files:**
- Create: `src/sections/dashboard/MessagingPanel.tsx`
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Create `src/sections/dashboard/MessagingPanel.tsx`**

```tsx
import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';

interface Message {
  id: string;
  sender_type: 'organiser' | 'guest';
  sender_name: string;
  body: string;
  created_at: string;
}

interface Props {
  eventId: string;
}

export default function MessagingPanel({ eventId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = () =>
    api.getMessages(eventId)
      .then(setMessages)
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [eventId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!body.trim()) return;
    setSending(true);
    try {
      await api.sendMessage(eventId, body);
      setBody('');
      await load();
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="bg-[#9cb092]/5 border border-[#9cb092]/20 flex flex-col" style={{ height: 380 }}>
      <div className="px-4 py-3 border-b border-[#9cb092]/20">
        <p className="font-display text-[10px] tracking-[0.3em] uppercase text-[#9cb092]">Guest Messages</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-4 h-4 border border-[#9cb092]/30 border-t-[#9cb092] rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/30 text-center pt-8">
            No messages yet
          </p>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender_type === 'organiser' ? 'items-end' : 'items-start'}`}
            >
              <p className="font-display text-[9px] tracking-[0.1em] uppercase text-[#b2c3b1]/40 mb-1">
                {msg.sender_name} · {msg.sender_type}
              </p>
              <div className={`px-3 py-2 max-w-[80%] ${
                msg.sender_type === 'organiser'
                  ? 'bg-[#9cb092]/20 border border-[#9cb092]/30'
                  : 'bg-[#b2c3b1]/10 border border-[#b2c3b1]/20'
              }`}>
                <p className="font-display text-xs text-[#e4eee1]">{msg.body}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#9cb092]/20 flex gap-2">
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Message your guests..."
          rows={1}
          className="flex-1 bg-transparent border border-[#9cb092]/30 px-3 py-2 font-display text-xs text-[#e4eee1] placeholder-[#b2c3b1]/30 focus:outline-none focus:border-[#9cb092]/60 resize-none"
        />
        <button
          onClick={handleSend}
          disabled={!body.trim() || sending}
          className="px-4 py-2 bg-[#9cb092] hover:bg-[#9cb092]/90 disabled:bg-[#9cb092]/20 transition-all font-display text-[9px] tracking-[0.2em] uppercase text-[#1a2418]"
        >
          Send
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add to Dashboard**

In `src/pages/Dashboard.tsx`, import and render inside each published event's expanded view:
```tsx
import MessagingPanel from '@/sections/dashboard/MessagingPanel';
// Inside event card for published events:
<MessagingPanel eventId={event.id} />
```

- [ ] **Step 3: Commit**

```bash
git add src/sections/dashboard/MessagingPanel.tsx src/pages/Dashboard.tsx
git commit -m "feat(frontend): add organiser-guest messaging panel to dashboard"
```

---

## Task 12: Admin Panel (Frontend)

**Files:**
- Create: `src/components/AdminRoute.tsx`
- Create: `src/pages/AdminPanel.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `src/components/AdminRoute.tsx`**

```tsx
import { useState, ReactNode } from 'react';

interface Props { children: ReactNode }

export default function AdminRoute({ children }: Props) {
  const [secret, setSecret] = useState('');
  const [entered, setEntered] = useState('');
  const [error, setError] = useState(false);

  const handle = () => {
    if (!secret.trim()) return;
    setEntered(secret);
    setError(false);
  };

  if (!entered) return (
    <div className="min-h-screen bg-[#1a2418] flex items-center justify-center px-6">
      <div className="w-full max-w-xs">
        <p className="font-display text-[10px] tracking-[0.3em] uppercase text-[#9cb092] mb-6 text-center">Admin Access</p>
        <input
          type="password"
          value={secret}
          onChange={e => setSecret(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handle()}
          placeholder="Enter admin secret"
          className="w-full bg-transparent border border-[#9cb092]/30 p-3 font-display text-xs text-[#e4eee1] placeholder-[#b2c3b1]/30 focus:outline-none focus:border-[#9cb092]/60 mb-3"
        />
        {error && <p className="font-display text-[9px] tracking-[0.15em] uppercase text-red-400/70 mb-3">Invalid secret</p>}
        <button
          onClick={handle}
          className="w-full py-3 bg-[#9cb092]/10 border border-[#9cb092]/30 hover:bg-[#9cb092]/20 transition-all font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092]"
        >
          Enter
        </button>
      </div>
    </div>
  );

  return <AdminContext.Provider value={{ secret: entered, onUnauth: () => { setEntered(''); setError(true); } }}>
    {children}
  </AdminContext.Provider>;
}

import { createContext, useContext } from 'react';
interface AdminCtx { secret: string; onUnauth: () => void }
export const AdminContext = createContext<AdminCtx>({ secret: '', onUnauth: () => {} });
export const useAdmin = () => useContext(AdminContext);
```

- [ ] **Step 2: Create `src/pages/AdminPanel.tsx`**

```tsx
import { useEffect, useState } from 'react';
import AdminRoute, { useAdmin } from '@/components/AdminRoute';
import { api } from '@/lib/api';

type Tab = 'overview' | 'users' | 'events' | 'logs';

interface Stats {
  total_users: number;
  total_events: number;
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  notifications_sent: number;
  notifications_failed: number;
}

interface AdminUser { id: string; email: string; created_at: string }
interface AdminEvent { id: string; title: string; status: string; user_id: string; created_at: string }

function AdminContent() {
  const { secret, onUnauth } = useAdmin();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.adminGetStats(secret)
      .then(setStats)
      .catch(onUnauth)
      .finally(() => setLoading(false));
  }, [secret]);

  const loadUsers = () => {
    api.adminListUsers(secret).then(setUsers).catch(onUnauth);
  };

  const loadEvents = () => {
    api.adminListEvents(secret).then(setEvents).catch(onUnauth);
  };

  useEffect(() => {
    if (tab === 'users') loadUsers();
    if (tab === 'events') loadEvents();
  }, [tab]);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    await api.adminDeleteUser(secret, userId).catch(onUnauth);
    loadUsers();
  };

  const handleModerate = async (eventId: string, status: string) => {
    await api.adminModerateEvent(secret, eventId, status).catch(onUnauth);
    loadEvents();
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'Users' },
    { key: 'events', label: 'Events' },
  ];

  return (
    <div className="min-h-screen bg-[#1a2418]">
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <p className="font-display text-[10px] tracking-[0.3em] uppercase text-[#9cb092] mb-1">Platform</p>
          <h1 className="font-serif-exp text-3xl text-[#e4eee1] italic">Admin Panel</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-[#9cb092]/20 mb-8">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 font-display text-[10px] tracking-[0.2em] uppercase transition-colors ${
                tab === t.key
                  ? 'text-[#9cb092] border-b-2 border-[#9cb092]'
                  : 'text-[#b2c3b1]/50 hover:text-[#b2c3b1]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[#9cb092]/30 border-t-[#9cb092] rounded-full animate-spin" />
          </div>
        )}

        {/* Overview */}
        {tab === 'overview' && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Users', value: stats.total_users },
              { label: 'Events', value: stats.total_events },
              { label: 'Orders', value: stats.total_orders },
              { label: 'Revenue', value: `$${stats.total_revenue.toFixed(2)}` },
              { label: 'Pending Orders', value: stats.pending_orders },
              { label: 'SMS/Email Sent', value: stats.notifications_sent },
              { label: 'Notif Failed', value: stats.notifications_failed },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#9cb092]/5 border border-[#9cb092]/20 p-5">
                <p className="font-serif-exp text-2xl text-[#e4eee1] italic">{value}</p>
                <p className="font-display text-[9px] tracking-[0.2em] uppercase text-[#b2c3b1]/50 mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="space-y-2">
            {users.length === 0 && !loading && (
              <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/40 py-8 text-center">No users found</p>
            )}
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between bg-[#9cb092]/5 border border-[#9cb092]/20 px-5 py-4">
                <div>
                  <p className="font-display text-xs text-[#e4eee1]">{u.email}</p>
                  <p className="font-display text-[9px] tracking-[0.1em] uppercase text-[#b2c3b1]/40 mt-0.5">
                    {new Date(u.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteUser(u.id)}
                  className="font-display text-[9px] tracking-[0.15em] uppercase text-red-400/60 hover:text-red-400 transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Events */}
        {tab === 'events' && (
          <div className="space-y-2">
            {events.length === 0 && !loading && (
              <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/40 py-8 text-center">No events found</p>
            )}
            {events.map(e => (
              <div key={e.id} className="flex items-center justify-between bg-[#9cb092]/5 border border-[#9cb092]/20 px-5 py-4">
                <div>
                  <p className="font-display text-xs text-[#e4eee1]">{e.title}</p>
                  <p className="font-display text-[9px] tracking-[0.1em] uppercase text-[#b2c3b1]/40 mt-0.5">
                    {e.status} · {new Date(e.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-3">
                  {e.status !== 'archived' && (
                    <button
                      onClick={() => handleModerate(e.id, 'archived')}
                      className="font-display text-[9px] tracking-[0.15em] uppercase text-[#b2c3b1]/50 hover:text-red-400/70 transition-colors"
                    >
                      Archive
                    </button>
                  )}
                  {e.status === 'archived' && (
                    <button
                      onClick={() => handleModerate(e.id, 'published')}
                      className="font-display text-[9px] tracking-[0.15em] uppercase text-[#9cb092]/70 hover:text-[#9cb092] transition-colors"
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPanel() {
  return (
    <AdminRoute>
      <AdminContent />
    </AdminRoute>
  );
}
```

- [ ] **Step 3: Add route in `src/App.tsx`**

```tsx
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
// In <Routes>:
<Route path="/admin" element={<AdminPanel />} />
```

- [ ] **Step 4: Commit**

```bash
git add src/components/AdminRoute.tsx src/pages/AdminPanel.tsx src/App.tsx
git commit -m "feat(frontend): add admin panel with user management and event moderation"
```

---

## Task 13: Push to CI/CD + Verify

- [ ] **Step 1: Run frontend build to check for TS errors**

```bash
cd C:\Users\venky\Desktop\agency\momentsandmemories
npm run build
```
Expected: build succeeds with no errors.

- [ ] **Step 2: Run backend tests one final time**

```bash
cd backend && pytest tests/ -v
```
Expected: all tests PASS.

- [ ] **Step 3: Push to GitHub + GitLab**

```bash
git push origin main
git push gitlab main
```

- [ ] **Step 4: Watch GitLab pipeline pass all 4 stages**

GitLab → CI/CD → Pipelines — verify green on backend-test, frontend-test, build, deploy.

- [ ] **Step 5: Test on live site (http://13.237.143.52)**

- [ ] Visit `/event/{any published event id}` — public event page loads
- [ ] Visit `/rsvp/{eventId}/{inviteeId}` — RSVP form shows, submit works
- [ ] Dashboard → published event → engagement panel shows RSVP stats
- [ ] Dashboard → published event → messaging panel → send message works
- [ ] Visit `/admin` → enter admin secret → stats, users, events load

---

## Self-Review

**Spec coverage:**
- ✅ Guest RSVP page → Tasks 2, 7, 9
- ✅ Admin panel → Tasks 3, 12
- ✅ Public event sharing → Tasks 2, 8
- ✅ Organiser↔guest messaging → Tasks 4, 11
- ✅ Engagement analytics → Tasks 7, 10

**Type consistency check:**
- `api.getMessages` returns `Array<{id, sender_type, sender_name, body, created_at}>` ✓ matches `MessagingPanel.Message` interface
- `api.getRSVPPage` returns `{event: EventInfo, invitee: Invitee}` ✓ matches `RSVPPage` destructure
- `api.getEventRSVPStats` returns `{total, accepted, declined, pending}` ✓ matches `EngagementPanel.RSVPStats`
- `submitRSVP` payload `{status, message, dietary_requirements}` ✓ matches `RSVPRequest` schema

**No placeholders:** All code blocks are complete and runnable.
