# `src/admin/` — design annotation studio (hidden)

Self-contained admin module for annotating evite templates with text-zone
metadata (bounding boxes, palette, character limits). Lives behind a hidden
URL and a shared-secret gate.

## How to access

1. Set `ADMIN_SECRET` in your backend `.env` to any long random string.
2. Visit `/_studio` on the running site.
3. Enter the secret. It is stored in `localStorage` so subsequent visits skip
   the prompt. Sign out clears it.

The secret is only known to you — no signup, no role plumbing on user accounts.
Backend returns **404** on a wrong/missing secret, so probing the URL leaks no
evidence of the module's existence.

## How it stays hidden from the public

- No link to `/_studio` exists anywhere in the public app.
- The route is mounted under a `/_*` prefix that `public/robots.txt` blocks.
- A `<meta name="robots" content="noindex,nofollow,noarchive">` injected here
  ensures search engines never index it even if the URL leaks.
- The admin API is `include_in_schema=False` (not in `/docs`).
- All admin endpoints return 404 on bad auth — they look like missing routes.

## How to remove this module

1. Delete this folder (`src/admin/`).
2. In `src/App.tsx`, remove the single line tagged `// admin module (removable)`
   and the matching `lazy(...)` import above it.
3. In `public/robots.txt`, remove the `/_studio` disallow line (optional).
4. On the backend, delete `backend/admin/` and remove its two lines from
   `backend/main.py` (see that module's README).

Removal leaves zero references — no shared types, no shared hooks. The public
preview (`FinalPreview`, `CreateEvite`) does not import anything from this
folder.

## Structure

```
src/admin/
  index.tsx                  # AdminRoutes — the single mount point
  types.ts                   # Zone / Palette / Layout types
  components/
    SecretGate.tsx           # Shared-secret entry, stores in localStorage
    ZoneCanvas.tsx           # Drag/resize bounding boxes on the image
    PalettePicker.tsx        # Sample dominant colors + manual picker
  pages/
    TemplatesList.tsx        # Grid of templates with annotation status
    TemplateAnnotator.tsx    # Single-template editor
  lib/
    adminClient.ts           # Fetch wrapper with X-Admin-Secret header
```

## Out-of-scope for v1

These are deliberate gaps that don't change the module shape — add them later
without touching anything in this folder's public surface:

- Wiring saved layouts into the live preview (`FinalPreview`, `CreateEvite`).
- Overflow warning + "designs that fit" alternative picker.
- LLM "Polish to fit" message-rewrite backend endpoint.
- Vision-model auto-suggest button for first-pass bounding boxes.
