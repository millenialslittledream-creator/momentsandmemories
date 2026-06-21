# Canvas Template Editor — Full Feature & Integration Plan

Status: PLANNING ONLY. No code written. No branch created yet. Per instruction: when
implementation starts, work happens on a dedicated branch and nothing gets pushed to
origin/gitlab until explicitly told to push.

Decision already made: Polotno is out of budget → building on **Konva.js + react-konva**
(free, official React bindings, better default performance than Fabric.js — see
`docs/evite-editor-research.md` for why Fabric.js was ruled out).

---

## 1. What the current system actually does (grounding facts, from full codebase read)

- **Templates today are static frontend data only** — `src/data/eviteTemplates.ts` defines 30
  templates as a rigid `TemplateFieldLayout` shape: fixed background image + an array of
  positioned text fields (x, y, font, color, align — but no free dragging, no images-as-elements,
  no video-as-element). There is **no `templates` table in the database at all**.
- **Two separate renderers already exist and must stay in sync** — live preview uses HTML/CSS
  (`TemplateRenderer.tsx`), final PNG export uses a hand-rolled Canvas2D script
  (`src/utils/templateCanvas.ts`). This dual-renderer setup is exactly the kind of thing that
  causes "looks right in the editor, wrong in the export" bugs flagged in the earlier research doc.
- **`events` table** stores only `template_id` (TEXT, references the static frontend list) +
  basic event fields (title, date, time, location, `cover_image_url`, status). It does **not**
  store the filled-in form data (name/date/venue text) or any canvas/design data.
- **File upload UI exists for images AND video already** (`CreateEvite.tsx` — accepts
  `image/*` and `video/mp4,video/quicktime`, up to 10MB/50MB respectively) — **but it's
  decorative only**. Files become temporary `URL.createObjectURL()` blob URLs, never uploaded
  anywhere, lost on refresh. **There is no upload backend, no Supabase Storage bucket, no
  media table at all.** This is the single biggest gap to close — it blocks the entire feature.
- **Video preview already works in the UI** (`<video>` tag with controls/autoplay) for the
  "upload your own" flow, but nothing is persisted, and there's no concept of compositing text
  over a video.
- **Git convention observed**: `feat(scope): message` / `fix(scope): message` commit style,
  `feature/...` branch naming (e.g. existing `feature/backend-fastapi`).

---

## 2. Full feature list for the editor

**Canvas / elements**
- Text elements: add, move (drag), resize, rotate, delete, duplicate, lock, reorder (z-index/layers)
- Image elements: upload own image, place as a layer, move/resize/rotate/crop, delete/duplicate
- Video element (see §5 — two-tier plan, this is the riskiest part)
- Background: solid color, gradient, one of the existing curated templates as a starting point, or a fully custom uploaded image

**Per-element property panel** (matches the reference screenshot)
- Font family, size, weight, style (bold/italic/underline)
- Color picker + saved palette
- Vertical align / Horizontal align / Text align
- Text case (aa / Aa / AA)
- Opacity, rotation

**Layer panel**
- Reorder layers (z-index), lock/unlock, duplicate, delete (the trash/layers/lock/rotate/duplicate row from the screenshot)

**Workflow**
- Undo/redo
- Autosave (debounced, same UX pattern as today's localStorage draft autosave, but now persisted server-side too — so a design survives a refresh/device switch, not just a session)
- "Start from a template" (loads one of the 30 existing designs as an editable starting point) or "start from blank"
- Save as **my template** (user's own reusable design, separate from the built-in template library)
- Mobile/touch support — **non-negotiable**, your audience is mobile-first (per the existing QR-contact-import flow built earlier)

---

## 3. Database changes needed

New migration(s) required:

```sql
-- New table: stores user-made canvas designs (separate from the static built-in template list)
CREATE TABLE public.user_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    name TEXT,
    event_type TEXT,                 -- mirrors EventType from eviteTemplates.ts for filtering
    canvas_width INT NOT NULL,
    canvas_height INT NOT NULL,
    background JSONB NOT NULL,       -- { type: 'color'|'image'|'video', value: '#fff'|url }
    elements JSONB NOT NULL DEFAULT '[]',  -- array of {type, x, y, width, height, rotation, zIndex, ...props}
    is_draft BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.user_templates ENABLE ROW LEVEL SECURITY;

-- New table: tracks every uploaded file (for cleanup, quota, ownership)
CREATE TABLE public.media_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('image', 'video')),
    mime_type TEXT,
    file_size_bytes INT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.media_uploads ENABLE ROW LEVEL SECURITY;

-- Extend events table: allow an event to point at a custom design instead of a built-in template
ALTER TABLE public.events ADD COLUMN custom_template_id UUID REFERENCES public.user_templates(id);
-- (Add a CHECK constraint: exactly one of template_id / custom_template_id should be set)
```

**Supabase Storage**: new bucket `user-uploads` (private, scoped via storage policy to the
owning `user_id`) for raw uploaded images/videos.

---

## 4. Backend changes needed

New `backend/media/` module:
- `POST /media/upload` — multipart upload, validates mime type + enforces the size limits the
  UI already advertises but never enforced (10MB image / 50MB video — currently a gap, flagged
  during codebase review), uploads to Supabase Storage, inserts a `media_uploads` row, returns
  the public/signed URL
- `DELETE /media/{id}` — for cleanup when a user removes an uploaded asset

New `backend/templates/` module (custom/user templates — separate from the static built-in list):
- `POST /templates` — save a new design (elements JSON + background + metadata)
- `GET /templates/mine` — list the current user's saved designs
- `PUT /templates/{id}` — update/autosave
- `DELETE /templates/{id}`

`events` module: extend `CreateEventRequest`/`UpdateEventRequest` to accept `custom_template_id`
alongside the existing `template_id`.

---

## 5. Video — explicit scope decision (the highest-risk item, don't hand-wave this)

Compositing text **directly into** a single downloadable video file (text "burned in") needs
real video encoding (ffmpeg), which is a much bigger and riskier undertaking than anything else
in this plan — it's effectively a separate feature with its own failure modes (encoding time,
server load, format compatibility).

**Recommended for v1 (Tier A)**: treat an uploaded video as a whole-design background, with any
text elements rendered as an **HTML/CSS overlay during in-app playback** — same idea as an
Instagram Story caption: the guest watches the video in the app/browser with text floating on
top, but it's never baked into one merged file. This matches what the UI in `CreateEvite.tsx`
already half-supports today, and just needs the Phase 1 upload backend wired in — **no video
processing engineering required**.

**Deferred (Tier B, only build if explicitly requested later)**: server-side ffmpeg compositing
to produce one single shareable video file with text burned in. Flag this as a distinct,
separately-scoped future feature — don't let it block or bloat v1.

---

## 6. Frontend architecture

- New `src/components/CanvasEditor/` housing: Konva `Stage`/`Layer`, a `Transformer` (Konva's
  built-in resize/rotate handles — no need to build this by hand), text/image node components,
  the property side panel, the layer list panel.
- **Konva replaces both existing renderers for designs made in the new editor**: edit and export
  both go through the same Konva stage (`stage.toDataURL()` for the final PNG), which directly
  eliminates the "two renderers must stay in sync" bug class that exists today.
- **The 30 existing built-in templates are left untouched** — they keep using
  `TemplateRenderer.tsx` + `templateCanvas.ts` exactly as-is. The new editor is an additional,
  separate path, not a replacement of the existing one. This avoids a risky big-bang migration
  of all 30 templates.
- Integration point in the existing flow: in the `CreateEvite.tsx` gallery screen, "Upload Your
  Own Design" becomes a third real option (pick built-in template / upload a flat file / **open
  the canvas editor**), feeding into the same downstream modal flow (form fields → guests →
  preview → payment) that already exists.

---

## 7. Phased build order

| Phase | What | Depends on |
|---|---|---|
| 0 | Create branch `feature/canvas-template-editor`, add `konva` + `react-konva` deps | — |
| 1 | Media upload backend (Storage bucket, `media_uploads` table, `POST /media/upload`) — **prerequisite for everything else**, since images/video/custom templates all need real file storage | Phase 0 |
| 2 | `user_templates` table + CRUD backend | Phase 1 |
| 3 | Konva canvas editor UI (text/image elements, property panel, layer panel, autosave) | Phase 1, 2 |
| 4 | Video Tier A (HTML/CSS text overlay during playback, wired to Phase 1 upload) | Phase 1 |
| 5 | Hook the new editor into the existing `CreateEvite.tsx` flow as a third creation option | Phase 3, 4 |
| 6 | Hardening: server-side file validation, storage cleanup job for abandoned drafts, upload rate limiting, RLS/storage policies, undo/redo | Phase 5 |

## 8. Git workflow (per your instruction)

- Implementation happens on branch **`feature/canvas-template-editor`**, created off `main`
- Commit style matches existing convention: `feat(canvas-editor): ...`
- **Nothing gets pushed to `origin` or `gitlab` until you explicitly say "push"** — work stays
  local/branch-only until then
