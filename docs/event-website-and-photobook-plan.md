# Event Website Builder + Digital Flip-Book Plan

Research done 2026-06-21. Two new feature ideas, both planning-only — no code written, no
branch created. Builds on top of `docs/canvas-editor-plan.md` (shares the same media-upload
infrastructure — see §4).

These are actually **three** distinct features once unpacked:
1. **Event website builder** — a personal scrollable mini-website (photos, schedule, animations), user-built, hosted at a shareable link
2. **Invitation as a flip-book** — the invite presented with a realistic page-turn animation instead of (or alongside) a single card image
3. **Guest photo gallery → auto-collage album** — guests upload their own photos from the event, all photos pool together and auto-arrange into a gallery/album, no manual curation needed

---

## 1. Who already does this (research)

**Event websites:**
- **WithJoy (Joy)** — most design flexibility of the dedicated platforms: rearrange sections, add custom pages, photo galleries + "storytelling" features. Free tier gives a subdomain (`yourname.withjoy.com`); paid tier ($39.99 one-time) adds a real custom domain.
- **Zola** — website + registry + budget + guest list all connected as one system; registry is the headline feature, not website design freedom.
- **Minted** — website and *printed* invitations share the same designer theme; sections for registry, maps, guest accommodations baked in.
- **Common pattern across all three**: it's a **section/block-based builder** (Hero, Our Story, Schedule, Photo Gallery, RSVP, Registry, Map/Travel, FAQ) — not a free-form canvas. Users pick/reorder/edit pre-built section types, they don't draw on a blank page.

**Flip-book / page-turn animation:**
- **StPageFlip** (with official `react-pageflip` React wrapper) — open-source, TypeScript, realistic page-turn physics, works with images or HTML content, has mobile touch support built in. This is the concrete library to use — confirmed actively maintained and free.
- **Turn.js** — the older, original library in this space; StPageFlip is the modern/maintained successor for a React app.

**Guest photo sharing → auto album:**
- **Fotify, Guesticon, Wedbox** (2026's leading examples) — guests scan a QR code, upload from their browser (no app install), photos stream into one shared pool/live screen.
- **Waldo Photos** — adds AI facial recognition to auto-sort which guest is in which photo (notably more advanced than basic pooling — flagged as an optional future enhancement, not core scope).
- **Key technical finding**: "automatic album/collage" in practice means a **masonry/grid auto-layout** (libraries like `Masonry`, `Masonry Grid`, `@agat/masonry-layout` — all simple, well-understood, free) — **not** AI image curation. This is a well-scoped, achievable feature, not a research project.

---

## 2. Feature 1 — Event website builder

**What it needs to be, concretely**: a block-based page builder, not a canvas editor. Each
website is an ordered list of **sections**, where each section is one of a fixed set of types:

- Hero (cover photo/video + names + date + countdown timer)
- Our Story (text + photos timeline)
- Schedule (list of sub-events — this maps directly onto the **existing** `eventsList`
  multi-event layout already built for weddings, per the canvas-editor codebase audit)
- Photo Gallery (feeds from Feature 3 below)
- RSVP (already exists as a feature — `event_invitees`/RSVP flow — this section just embeds it)
- Map/Venue, FAQ, custom text block

Each section type has its own small set of editable fields (not free-form canvas dragging) —
this is a deliberately simpler editing model than the canvas evite editor, and that's correct:
website builders in the research are all block-based, none of them are free-form canvas.

**Database**: new table:
```sql
CREATE TABLE public.event_websites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,        -- shareable URL: mymomentsnmemories.com/w/{slug}
    sections JSONB NOT NULL DEFAULT '[]',  -- ordered array of {type, content, order}
    theme JSONB,                       -- colors/fonts for the whole site
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Frontend**: a new `EventWebsiteBuilder` — section list (add/reorder/remove sections), a small
form per section type (not Konva — this is a different editor entirely from the evite canvas
editor). Public-facing render route `/w/:slug` (no auth needed, like the existing public RSVP
pages already in the codebase).

---

## 3. Feature 2 — Invitation as a flip-book

**Concrete plan**: use `react-pageflip` (StPageFlip). A "book" is just an ordered array of pages,
where each page is an image — and here's the synergy with the canvas editor plan: **each page
can be a Konva-rendered canvas design** (same `user_templates` element schema from the canvas
editor plan, just one row per page instead of one design per template). So building the canvas
editor first actually gives this feature most of what it needs for free — the only new work is:
1. Allow a `user_templates`-style design to have multiple **pages** instead of one
2. Feed the array of rendered page images into `react-pageflip` for the turn animation

**Scope decision (digital vs. physical, flag explicitly)**: this plan covers a **digital,
in-browser flip-through experience only** — no physical printed book. Physical printing would
need a print-on-demand vendor integration (shipping, separate payment flow, production lead
time) and is a distinct feature with its own research — not assumed in scope here unless you
want that separately.

---

## 4. Feature 3 — Guest photo gallery → auto-collage album

**This directly reuses the media-upload infrastructure already planned in
`docs/canvas-editor-plan.md` §3-4** (`media_uploads` table, Supabase Storage bucket, `POST
/media/upload` endpoint) — don't build this twice. The only new pieces:

```sql
CREATE TABLE public.event_gallery_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    media_upload_id UUID NOT NULL REFERENCES public.media_uploads(id),
    uploaded_by_name TEXT,            -- guest's name (no account required to contribute)
    approved BOOLEAN DEFAULT true,    -- host moderation toggle, optional
    created_at TIMESTAMPTZ DEFAULT now()
);
```

- Guests reach an upload page via a **QR code** — same QR-scan pattern already built for the
  contact-import feature (`backend/qr/service.py`), reused here for a different purpose (photo
  upload instead of contact transfer)
- No guest account/login required — matches how the competitor apps work (Fotify/Guesticon/Wedbox
  all do browser-based upload with no app install)
- Display: masonry/grid auto-layout (e.g. `masonry-grid` or `@agat/masonry-layout`, both free,
  small, no AI/ML needed — confirmed via research this is the realistic technical approach, not
  a research problem)
- **Optional later step**: feed the same photo set into the Feature 2 flip-book renderer for a
  "view as an album" presentation mode — i.e., Features 2 and 3 can share one flip-book
  component, just with different page sources (canvas designs vs. guest photos)
- AI facial-recognition guest-sorting (like Waldo Photos) — explicitly **not** in scope for v1,
  flagged as a possible future enhancement only

---

## 5. How these three connect to each other and to the canvas editor plan

```
media_uploads (Supabase Storage)  ←─ shared by ─→  Feature 3 (guest photos)
        ↑                                                    │
        │                                                    ▼
user_templates (Konva pages)  ──page images──→  Feature 2 flip-book renderer
        │
        ▼
Feature 1 website builder (Photo Gallery section embeds Feature 3;
                            could also embed a Feature 2 flip-book as a section type)
```

Building the canvas editor's media-upload backend first (Phase 1 of the other plan) is the
correct order — it unlocks Feature 3 almost immediately, and Feature 2 mostly reuses Phase 3
(Konva rendering) of that same plan.

---

## 6. Build order (adds onto the canvas editor's phases, doesn't restart them)

| Phase | What | Depends on |
|---|---|---|
| Canvas editor Phase 1 | Media upload backend | (already planned) |
| New: Gallery phase | `event_gallery_photos` table, guest upload page (QR-driven, no login), masonry display | Canvas editor Phase 1 |
| Canvas editor Phase 3 | Konva editor (multi-page support added) | (already planned, extend for pages) |
| New: Flip-book phase | `react-pageflip` integration, feeds from either canvas pages or gallery photos | Canvas editor Phase 3 |
| New: Website builder phase | `event_websites` table, section-based builder UI, public `/w/:slug` route | Independent — can start anytime, only the Photo Gallery section depends on the Gallery phase |

## 7. Git workflow (same as before)

- All of this is additional scope for the same `feature/canvas-template-editor` branch, or its
  own `feature/event-website-builder` / `feature/photo-gallery` branches if you'd rather split
  the work — your call when we get to implementation
- Nothing pushed to `origin`/`gitlab` until you explicitly say so
