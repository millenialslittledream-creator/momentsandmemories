# `backend/admin/` — design annotation module

Self-contained module powering the hidden `/_studio` annotation UI. Stores
per-template text-zone metadata (bounding boxes, colors, character caps) in a
local JSON file, served back to the public site for the live preview.

## How it stays hidden

- The admin router has `include_in_schema=False` — it does not appear in the
  OpenAPI docs at `/docs`.
- All admin endpoints return **404** (not 401/403) on a missing or invalid
  `X-Admin-Secret` header, so probing the URL cannot confirm the module exists.
- The shared secret lives in `settings.admin_secret` (env: `ADMIN_SECRET`).

## How to remove this module

1. Delete this folder (`backend/admin/`).
2. In `backend/main.py`, remove the two lines that import and include the
   `admin` routers (they are tagged with `# admin module` for grep-ability).
3. The public site falls back gracefully — `FinalPreview` checks for layouts
   and uses the existing default placement when none are found.

Removal leaves zero references elsewhere in the codebase.

## Data file

`layouts.json` is written next to this file. It is gitignored by default —
add it to source control only if you want annotations to ship with the repo.
