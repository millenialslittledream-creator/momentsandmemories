# Draft Saving, Dashboard & Auth Gate — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add draft auto-save with "continue where you left off" prompt, a per-user dashboard showing events and stats, and a login gate when clicking "Create Evite" while signed out.

**Architecture:**
- New `event_drafts` Supabase table (one row per user, upserted on change)
- New `backend/drafts/` FastAPI module (GET/PUT/DELETE /api/drafts/my)
- `CreateEvite.tsx` debounced auto-save + draft restore on mount
- New `Dashboard.tsx` page at `/dashboard` reading existing `GET /api/events` + draft
- `ProtectedRoute` wrapper redirects unauthenticated users to `/signin?redirect=/create`

**Tech Stack:** FastAPI, Supabase (PostgreSQL + RLS), React 18, TypeScript, Tailwind, `useAuth` hook from `src/context/AuthContext.tsx`

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `backend/migrations/010_create_event_drafts.sql` | Create | Supabase migration for drafts table |
| `backend/drafts/__init__.py` | Create | Package marker |
| `backend/drafts/schemas.py` | Create | Pydantic request/response models |
| `backend/drafts/service.py` | Create | DB logic: get, upsert, delete draft |
| `backend/drafts/router.py` | Create | API routes: GET/PUT/DELETE /drafts/my |
| `backend/main.py` | Modify | Register drafts router |
| `src/lib/api.ts` | Modify | Add getDraft, saveDraft, deleteDraft, getMyEvents |
| `src/components/ProtectedRoute.tsx` | Create | Redirect to signin if not logged in |
| `src/App.tsx` | Modify | Wrap `/create` in ProtectedRoute, add `/dashboard` route |
| `src/pages/CreateEvite.tsx` | Modify | Auto-save draft on state change, restore on mount, delete on confirm |
| `src/pages/Dashboard.tsx` | Create | User dashboard page |
| `src/sections/Navigation.tsx` | Modify | Dashboard link when logged in |

---

## Task 1: Supabase migration — event_drafts table

**Files:**
- Create: `backend/migrations/010_create_event_drafts.sql`

- [ ] **Step 1: Write the migration**

```sql
-- backend/migrations/010_create_event_drafts.sql
CREATE TABLE IF NOT EXISTS event_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step INTEGER NOT NULL DEFAULT 0,
  event_type TEXT,
  form_data JSONB NOT NULL DEFAULT '{}',
  selected_template TEXT,
  guests JSONB NOT NULL DEFAULT '[]',
  delivery_preference TEXT NOT NULL DEFAULT 'email',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One active draft per user
CREATE UNIQUE INDEX IF NOT EXISTS event_drafts_user_idx ON event_drafts (user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_event_drafts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER event_drafts_updated_at
  BEFORE UPDATE ON event_drafts
  FOR EACH ROW EXECUTE FUNCTION update_event_drafts_updated_at();

-- RLS: users can only touch their own draft
ALTER TABLE event_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_draft_select" ON event_drafts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own_draft_insert" ON event_drafts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_draft_update" ON event_drafts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "own_draft_delete" ON event_drafts
  FOR DELETE USING (auth.uid() = user_id);
```

- [ ] **Step 2: Commit**

```bash
git add backend/migrations/010_create_event_drafts.sql
git commit -m "feat: add event_drafts migration"
```

---

## Task 2: Backend drafts module

**Files:**
- Create: `backend/drafts/__init__.py`
- Create: `backend/drafts/schemas.py`
- Create: `backend/drafts/service.py`
- Create: `backend/drafts/router.py`

- [ ] **Step 1: Write schemas**

```python
# backend/drafts/schemas.py
from pydantic import BaseModel
from typing import Any

class DraftUpsertRequest(BaseModel):
    step: int
    event_type: str | None = None
    form_data: dict[str, Any] = {}
    selected_template: str | None = None
    guests: list[dict[str, Any]] = []
    delivery_preference: str = "email"

class DraftResponse(BaseModel):
    id: str
    user_id: str
    step: int
    event_type: str | None
    form_data: dict[str, Any]
    selected_template: str | None
    guests: list[dict[str, Any]]
    delivery_preference: str
    created_at: str
    updated_at: str
```

- [ ] **Step 2: Write service**

```python
# backend/drafts/service.py
import database
from middleware.logging import log_event as _log


def get_draft(user_id: str) -> dict | None:
    db = database.get_db()
    result = db.table("event_drafts").select("*").eq("user_id", user_id).execute()
    return result.data[0] if result.data else None


def upsert_draft(user_id: str, data: dict) -> dict:
    db = database.get_db()
    existing = db.table("event_drafts").select("id").eq("user_id", user_id).execute()
    if existing.data:
        result = db.table("event_drafts").update(data).eq("user_id", user_id).execute()
    else:
        result = db.table("event_drafts").insert({**data, "user_id": user_id}).execute()
    _log("drafts", "draft.saved", user_id=user_id, metadata={"step": data.get("step")})
    return result.data[0]


def delete_draft(user_id: str) -> None:
    db = database.get_db()
    db.table("event_drafts").delete().eq("user_id", user_id).execute()
    _log("drafts", "draft.deleted", user_id=user_id)
```

- [ ] **Step 3: Write router**

```python
# backend/drafts/router.py
from fastapi import APIRouter, Depends, HTTPException
from middleware.auth import get_current_user
from drafts.schemas import DraftUpsertRequest, DraftResponse
from drafts import service

router = APIRouter(prefix="/drafts", tags=["drafts"])


@router.get("/my", response_model=DraftResponse | None)
def get_my_draft(current_user: dict = Depends(get_current_user)):
    return service.get_draft(current_user["sub"])


@router.put("/my", response_model=DraftResponse)
def save_my_draft(data: DraftUpsertRequest, current_user: dict = Depends(get_current_user)):
    return service.upsert_draft(current_user["sub"], data.model_dump())


@router.delete("/my", status_code=204)
def delete_my_draft(current_user: dict = Depends(get_current_user)):
    service.delete_draft(current_user["sub"])
```

- [ ] **Step 4: Create `__init__.py`**

```python
# backend/drafts/__init__.py
```

- [ ] **Step 5: Register router in main.py**

In `backend/main.py`, add after the existing router imports:
```python
from drafts.router import router as drafts_router
```
And in the router registration section:
```python
app.include_router(drafts_router)
```

- [ ] **Step 6: Commit**

```bash
git add backend/drafts/ backend/main.py
git commit -m "feat: drafts module — GET/PUT/DELETE /api/drafts/my"
```

---

## Task 3: API client — draft + events methods

**Files:**
- Modify: `src/lib/api.ts`

- [ ] **Step 1: Add draft and events methods**

Append to the `api` object in `src/lib/api.ts`:

```typescript
  getDraft: () =>
    apiFetch<{
      id: string;
      step: number;
      event_type: string | null;
      form_data: Record<string, string>;
      selected_template: string | null;
      guests: Array<{ id: string; name: string; email: string; phone: string }>;
      delivery_preference: 'email' | 'phone' | 'both';
      updated_at: string;
    } | null>('/drafts/my'),

  saveDraft: (data: {
    step: number;
    event_type: string | null;
    form_data: Record<string, string>;
    selected_template: string | null;
    guests: Array<{ id: string; name: string; email: string; phone: string }>;
    delivery_preference: string;
  }) =>
    apiFetch<unknown>('/drafts/my', { method: 'PUT', body: JSON.stringify(data) }),

  deleteDraft: () =>
    apiFetch<unknown>('/drafts/my', { method: 'DELETE' }),

  getMyEvents: () =>
    apiFetch<Array<{
      id: string;
      title: string;
      event_date: string;
      event_time: string | null;
      location: string | null;
      status: string;
      template_id: string | null;
      created_at: string;
    }>>('/events'),
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: add draft and getMyEvents methods to API client"
```

---

## Task 4: ProtectedRoute component + routing

**Files:**
- Create: `src/components/ProtectedRoute.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create ProtectedRoute**

```tsx
// src/components/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to={`/signin?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: Update App.tsx routes**

In `src/App.tsx`, import the new components:
```typescript
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
```

Wrap the `/create` route:
```tsx
<Route path="/create" element={<ProtectedRoute><CreateEvite /></ProtectedRoute>} />
```

Add dashboard route:
```tsx
<Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
```

- [ ] **Step 3: Update SignIn to redirect after login**

In `src/pages/SignIn.tsx`, after successful sign-in, read `?redirect` param and navigate there:
```typescript
import { useSearchParams, useNavigate } from 'react-router-dom';

// Inside the component:
const [searchParams] = useSearchParams();
const navigate = useNavigate();
const redirectTo = searchParams.get('redirect') || '/';

// After successful sign-in:
navigate(redirectTo, { replace: true });
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/components/ProtectedRoute.tsx src/App.tsx src/pages/SignIn.tsx
git commit -m "feat: ProtectedRoute — redirect to signin with ?redirect param"
```

---

## Task 5: Auto-save draft in CreateEvite

**Files:**
- Modify: `src/pages/CreateEvite.tsx`

- [ ] **Step 1: Add draft restore on mount**

At the top of the `CreateEvite` component, add a `useEffect` that runs once after the user is confirmed logged in, fetches the draft, and offers to restore it:

```typescript
const [draftChecked, setDraftChecked] = useState(false);
const [pendingDraft, setPendingDraft] = useState<null | {
  step: number;
  event_type: string | null;
  form_data: Record<string, string>;
  selected_template: string | null;
  guests: Array<{ id: string; name: string; email: string; phone: string }>;
  delivery_preference: 'email' | 'phone' | 'both';
  updated_at: string;
}>(null);

// Load draft once on mount
useEffect(() => {
  api.getDraft()
    .then((draft) => {
      if (draft && draft.step > 0) setPendingDraft(draft);
    })
    .catch(() => {})
    .finally(() => setDraftChecked(true));
}, []);
```

- [ ] **Step 2: Add "Continue?" modal JSX**

Inside the return, before the main layout, add:

```tsx
{pendingDraft && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
    <div className="bg-[#1a2418] border border-[#9cb092]/30 p-8 max-w-sm w-full text-center">
      <span className="material-icons text-[#9cb092] text-3xl mb-4 block">edit_note</span>
      <h3 className="font-serif-exp text-xl text-[#e4eee1] italic mb-3">Continue your evite?</h3>
      <p className="font-display text-[10px] tracking-[0.15em] text-[#b2c3b1]/60 uppercase mb-6">
        You left off at step {pendingDraft.step + 1}
        {pendingDraft.event_type ? ` — ${pendingDraft.event_type}` : ''}
        <br />
        Last saved {new Date(pendingDraft.updated_at).toLocaleDateString()}
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => {
            // Restore all state from draft
            if (pendingDraft.event_type) setEventType(pendingDraft.event_type as EventType);
            setFormData(pendingDraft.form_data);
            if (pendingDraft.selected_template) setSelectedTemplate(pendingDraft.selected_template);
            if (pendingDraft.guests?.length) setGuests(pendingDraft.guests);
            setDeliveryPreference(pendingDraft.delivery_preference);
            setStep(pendingDraft.step);
            setPendingDraft(null);
          }}
          className="flex-1 py-3 bg-[#9cb092] text-[#0d1a10] font-display text-[10px] tracking-[0.2em] uppercase"
        >
          Continue
        </button>
        <button
          onClick={() => {
            api.deleteDraft().catch(() => {});
            setPendingDraft(null);
          }}
          className="flex-1 py-3 border border-white/15 text-[#b2c3b1]/60 font-display text-[10px] tracking-[0.2em] uppercase hover:border-white/30 transition-colors"
        >
          Start Fresh
        </button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 3: Add auto-save useEffect**

Add after the existing `useEffect` blocks:

```typescript
const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
  if (!draftChecked || pendingDraft || step === 0) return;
  if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
  saveTimeoutRef.current = setTimeout(() => {
    api.saveDraft({
      step,
      event_type: eventType,
      form_data: formData,
      selected_template: selectedTemplate,
      guests,
      delivery_preference: deliveryPreference,
    }).catch(() => {});
  }, 2000);
  return () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
  };
}, [step, eventType, formData, selectedTemplate, guests, deliveryPreference, draftChecked, pendingDraft]);
```

- [ ] **Step 4: Delete draft on confirm**

In `handleConfirm`, after `setConfirmed(true)`:
```typescript
api.deleteDraft().catch(() => {});
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/pages/CreateEvite.tsx
git commit -m "feat: auto-save draft in CreateEvite with continue prompt"
```

---

## Task 6: Dashboard page

**Files:**
- Create: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Write Dashboard component**

```tsx
// src/pages/Dashboard.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/sections/Navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface EventRow {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  location: string | null;
  status: string;
  template_id: string | null;
  created_at: string;
}

interface Draft {
  step: number;
  event_type: string | null;
  updated_at: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getMyEvents().catch(() => [] as EventRow[]),
      api.getDraft().catch(() => null),
    ]).then(([evs, dr]) => {
      setEvents(evs);
      setDraft(dr && dr.step > 0 ? dr : null);
      setLoading(false);
    });
  }, []);

  const upcoming = events.filter(
    (e) => e.status === 'published' && new Date(e.event_date) >= new Date()
  );
  const totalGuests = 0; // Will populate when invitees endpoint is added

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1a10] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#9cb092]/30 border-t-[#9cb092] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1a10] text-[#e4eee1]">
      <Navigation />
      <div className="pt-24 px-4 pb-16 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <p className="font-display text-[10px] tracking-[0.25em] uppercase text-[#9cb092]/70 mb-2">
            Welcome back
          </p>
          <h1 className="text-3xl md:text-5xl font-serif-exp italic text-[#e4eee1]">
            {user?.email?.split('@')[0]}
          </h1>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-px bg-white/5 mb-10 border border-white/5">
          {[
            { label: 'Total Evites', value: events.length },
            { label: 'Upcoming', value: upcoming.length },
            { label: 'Guests Invited', value: totalGuests },
          ].map((s) => (
            <div key={s.label} className="bg-[#0d1a10] px-6 py-5 text-center">
              <p className="text-2xl font-serif-exp text-[#9cb092] mb-1">{s.value}</p>
              <p className="font-display text-[9px] tracking-[0.2em] uppercase text-[#b2c3b1]/40">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Active Draft */}
        {draft && (
          <div className="mb-8 border border-[#9cb092]/20 bg-[#9cb092]/5 p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="material-icons text-[#9cb092] text-2xl">edit_note</span>
              <div>
                <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#9cb092] mb-0.5">
                  Draft in progress
                </p>
                <p className="text-sm text-[#b2c3b1]/60">
                  {draft.event_type || 'Evite'} — Step {draft.step + 1}
                  {' · '}Last saved {new Date(draft.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/create')}
              className="flex-shrink-0 px-6 py-2 bg-[#9cb092] text-[#0d1a10] font-display text-[10px] tracking-[0.2em] uppercase hover:bg-[#b2c3b1] transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Events list */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif-exp text-lg italic text-[#e4eee1]">Your Evites</h2>
          <button
            onClick={() => navigate('/create')}
            className="font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092] hover:text-[#b2c3b1] flex items-center gap-1 transition-colors"
          >
            <span className="material-icons text-sm">add</span>
            New Evite
          </button>
        </div>

        {events.length === 0 ? (
          <div className="border border-white/5 bg-white/[0.02] p-12 text-center">
            <span className="material-icons text-[#9cb092]/30 text-4xl mb-4 block">celebration</span>
            <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/30 mb-6">
              No evites yet
            </p>
            <button
              onClick={() => navigate('/create')}
              className="px-8 py-3 bg-[#3d4a35] text-white font-display text-[10px] tracking-[0.2em] uppercase hover:bg-[#4d5a44] transition-colors"
            >
              Create Your First Evite
            </button>
          </div>
        ) : (
          <div className="space-y-px">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-4 px-5 py-4 bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#e4eee1] truncate">{event.title}</p>
                  <p className="font-display text-[9px] tracking-[0.1em] uppercase text-[#b2c3b1]/40 mt-0.5">
                    {new Date(event.event_date).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                    {event.location ? ` · ${event.location}` : ''}
                  </p>
                </div>
                <span
                  className={`font-display text-[9px] tracking-[0.15em] uppercase px-2 py-1 border ${
                    event.status === 'published'
                      ? 'border-[#9cb092]/30 text-[#9cb092]'
                      : 'border-white/10 text-[#b2c3b1]/40'
                  }`}
                >
                  {event.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: Dashboard page with stats, draft card, and events list"
```

---

## Task 7: Navigation — Dashboard link

**Files:**
- Modify: `src/sections/Navigation.tsx`

- [ ] **Step 1: Add Dashboard to nav links when logged in**

In `src/sections/Navigation.tsx`, find where nav links are defined. The "Create Evite" link is at:
```
{ label: 'Create Evite', id: '', path: '/create' }
```

Add a Dashboard link that only shows when user is logged in. Import `useAuth`:
```typescript
import { useAuth } from '@/context/AuthContext';
```

In the component body:
```typescript
const { user } = useAuth();
```

Then in the links array or JSX, conditionally add a Dashboard link:
```tsx
{user && (
  <Link to="/dashboard" className="...existing nav link styles...">
    Dashboard
  </Link>
)}
```

Match the exact style of the existing nav links — look at how "Create Evite" is rendered and copy that pattern.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/sections/Navigation.tsx
git commit -m "feat: show Dashboard link in nav when logged in"
```

---

## Task 8: Run migration in Supabase

This is a manual step — run the SQL from `backend/migrations/010_create_event_drafts.sql` in the Supabase dashboard SQL editor.

- [ ] **Step 1: Open Supabase dashboard → SQL Editor**
- [ ] **Step 2: Paste and run `010_create_event_drafts.sql`**
- [ ] **Step 3: Verify table exists under Table Editor → `event_drafts`**

---

## Verification Checklist

After all tasks complete, verify:

- [ ] Visiting `/create` while signed out redirects to `/signin?redirect=%2Fcreate`
- [ ] After signing in, user lands on `/create` (not home)
- [ ] Starting an evite (step > 0), then closing and reopening `/create` shows the "Continue?" modal
- [ ] Clicking "Continue" restores all state (step, form data, template, guests)
- [ ] Clicking "Start Fresh" clears the draft and starts from step 0
- [ ] Completing an evite deletes the draft (no more modal on next visit)
- [ ] `/dashboard` shows the user's events list and stats
- [ ] `/dashboard` shows the draft card if a draft exists
- [ ] Dashboard "Continue" button navigates to `/create` and shows the restore modal
- [ ] Navigation shows "Dashboard" link when logged in, hides when logged out
