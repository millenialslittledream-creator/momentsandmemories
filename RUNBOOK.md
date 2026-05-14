# Moments & Memories — Local Setup & Studio Runbook

This runbook covers running the full stack locally (backend + frontend) and using the hidden `/_studio` design studio with its four AI-assist options.

If you only want to test the public site, do **§1–§3**. If you're authoring evite/flier template layouts (admin work), continue through **§4** and pick whichever LLM option fits your subscription/budget.

---

## 1. Prerequisites

| Tool | Min version | Notes |
|---|---|---|
| Node.js | 20+ | `node -v` |
| npm | 10+ | ships with Node |
| Python | 3.11+ | `python --version` |
| Git | any recent | for cloning |

Optional for one of the AI-assist paths:
- **Anthropic API key** (console.anthropic.com — separate from your Claude.ai subscription)
- **Ollama** (https://ollama.com) — for fully-local AI

---

## 2. Get the code

```bash
git clone <repo-url>
cd momentsandmemories
git checkout <your-branch>      # or the branch your task assigns
```

If you're working in the `elastic-ride-8f7370` worktree shared by Claude, it's already checked out — open the folder.

---

## 3. Set up backend (FastAPI)

```bash
cd backend

# Create a Python venv (one-time)
python -m venv .venv

# Activate
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Windows Git Bash / macOS / Linux:
source .venv/bin/activate

# Install deps
pip install -r requirements.txt
```

### Create `backend/.env`

Copy these placeholders into `backend/.env`. Real Supabase credentials are only needed for sign-in / event-saving — the studio works without them.

```env
SUPABASE_URL=https://placeholder.supabase.co
SUPABASE_SERVICE_KEY=placeholder-service-key
JWT_SECRET=placeholder-jwt-secret-for-local-testing
JWT_EXPIRE_MINUTES=60
ADMIN_SECRET=change-me-to-a-long-random-string
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
```

**Important:** change `ADMIN_SECRET` to something only you/your team know. This is the password for `/_studio`.

### Run backend

```bash
# from the backend/ folder, with venv active:
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

You should see `Uvicorn running on http://127.0.0.1:8000`. Leave it running in this terminal.

### Verify

In a separate terminal:
```bash
curl http://127.0.0.1:8000/health
# → {"status":"ok","version":"1.0.0"}
```

---

## 4. Set up frontend (Vite + React)

```bash
# from repo root (new terminal):
npm install
```

### Create `.env.local` at the repo root

```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://placeholder.supabase.co
VITE_SUPABASE_ANON_KEY=placeholder-anon-key-for-local-testing
```

(Optionally `VITE_GOOGLE_MAPS_API_KEY=...` if you want the venue autocomplete to work.)

### Run frontend

```bash
npm run dev
```

You'll see `http://localhost:5173/`. Open that in your browser.

---

## 5. Smoke test

| URL | What you should see |
|---|---|
| `http://localhost:5173/` | Home page loads, no console errors |
| `http://localhost:5173/create` | Template gallery, can pick a template, fill fields, see live preview |
| `http://localhost:5173/_studio` | Password prompt — enter your `ADMIN_SECRET` from `.env` |

If `/_studio` keeps rejecting your secret with no error: open DevTools → Network and look at the `POST /_studio/api/auth/verify` request. A **404** with the wrong secret is by design (stealth — see §10). A **404** with the *right* secret means the backend isn't running or the secrets don't match.

---

## 6. Studio overview — annotating a template

The studio is at `/_studio` and lets you author per-template text-zone metadata. End users at `/create` see the result.

1. **Browse** the template grid. Green dot = annotated, yellow dot = not yet.
2. **Click a template** to open the annotator.
3. Click **+ Add preset** in the top bar — pick a starting layout (Script Hero Stack, Date Block Vertical, etc.). It drops a polygon onto the canvas.
4. **Drag corners** to reshape the polygon. **Click white midpoint dots** on edges to add new vertices. **Right-click a vertex** to remove it (min 3 vertices).
5. On the right panel, click any line to edit its **font, weight, italic, UPPER, size %, tracking, align, effect, curve preset**.
6. **Drag lines** in the line list (or use ↑↓ arrows) to reorder.
7. The color palette at the bottom uses dominant colors sampled from the template image. Alt-click a swatch to mark it as a user-selectable color.
8. Click **Save** in the top bar (or the studio is dirty and warns you).

The annotation lives on the backend at `backend/admin/layouts.json` and is served publicly to `/create` via `GET /templates/layouts`.

---

## 7. AI suggest — the four options

In `/_studio → Settings`, pick one of the four LLM providers. Each has different trade-offs.

### Option L1 — Paste workflow (free, uses your Claude.ai subscription)

**Cost:** $0. Uses whatever subscription tier you already pay for at claude.ai.

**Set up:** none. Just pick "Paste workflow" in Settings.

**Use:**
1. Open a template in the studio.
2. Click **✨ Suggest** in the top bar.
3. Click **📋 Copy image + prompt** — this puts both the template image and the prompt on your clipboard.
4. Click **↗ Open claude.ai** — a new tab opens.
5. In Claude, press **Ctrl+V once** — the image attaches and the prompt fills in. Press **Enter**.
6. Wait for Claude's response. Select the entire JSON block and copy it.
7. Back in the studio dialog, paste it into the textarea and click **Parse →**.
8. Review the preview, click **Apply to canvas**, then **Save**.

**Troubleshooting:**
- *"Claude says no image provided"* — Your browser's clipboard didn't include the image. Click **⬇ Download image** instead and drag the file into Claude's chat alongside the pasted prompt.
- *"Could not copy"* — Some browsers (notably Firefox in private mode) block `ClipboardItem`. Use the Download image fallback.

### Option L2 — Anthropic API key (~$0.005 per template, fully automated)

**Cost:** real money — about $0.005 per template suggestion using Claude Haiku 4.5. Annotating all 42 templates would cost roughly $0.20. *This is separate billing from claude.ai Pro/Team* — you need an API key from [console.anthropic.com](https://console.anthropic.com).

**Set up:**
1. Get an API key at https://console.anthropic.com/settings/keys.
2. In `/_studio → Settings`, pick "Anthropic API key".
3. Paste the key (starts with `sk-ant-...`). It's stored only in your browser's localStorage, never sent anywhere except via the local backend to the Anthropic API.
4. Save.

**Use:**
1. Open a template, click **✨ Suggest**.
2. Click **Generate suggestion**. The studio sends the template image + prompt to Claude Haiku 4.5 (via your local backend proxy at `/_studio/api/llm/suggest`).
3. Wait ~5–15 seconds. The response auto-parses; review and apply.

**Troubleshooting:**
- *"LLM call failed: AuthenticationError"* — your key is wrong or expired.
- *"LLM call failed: NotFoundError"* — model name is wrong; we use `claude-haiku-4-5-20251001`. If Anthropic renames it, the backend code at `backend/admin/llm.py:_ANTHROPIC_MODEL` needs updating.

### Option L3 — Local Ollama (free, fully local, lower quality)

**Cost:** $0. Everything runs on your machine. No data leaves it.

**Set up:**
1. Install Ollama from https://ollama.com.
2. Pull a vision model:
   ```bash
   ollama pull llama3.2-vision
   ```
   (About 8 GB download; needs ~6 GB RAM headroom to run.)
3. Make sure `ollama serve` is running (it usually starts automatically as a background service).
4. In `/_studio → Settings`, pick "Local Ollama". Leave the URL as `http://localhost:11434` unless you've changed Ollama's port.

**Use:** same as L2 — click **✨ Suggest → Generate suggestion**.

**Troubleshooting:**
- *"connection refused"* — Ollama isn't running. Start it with `ollama serve`.
- *Suggestions are noticeably worse than Claude* — expected. `llama3.2-vision` is a smaller open model. It's free, but JSON output reliability is lower; you may need to nudge it with the "Parse →" button after editing the raw response.
- *Very slow* — first invocation loads the model into RAM/VRAM (~30s); subsequent calls are 5–15s.

### Option L4 — Off (manual authoring)

**Cost:** $0. No AI.

**Set up:** pick "Off" in Settings.

**Use:** the Suggest button disappears. Use **+ Add preset** in the studio header to drop pre-built layouts (Script Hero Stack, Date Block Vertical, Pipe Date Row, Hero + Script Subtitle, Bold + Script Combo, Info Stack), then drag corners and tweak per-line styling manually. ~5 minutes per template once you're fluent.

---

## 8. End-user experience to verify (`/create`)

After annotating at least one template in the studio, visit `/create` and verify:

1. **Templates with green dots in the studio** render text *inside the polygon zones you drew* — not the default bottom-left gradient block.
2. **The hero text uses the script + caps + small-caps stack** your annotation specified (or whatever preset you used).
3. **The date block** appears wherever you put it.
4. **Custom-message field**: typing past the template's per-line `max_chars` cap turns the counter yellow and shows a "see designs that fit →" link. Clicking it offers alternate templates that have a higher message capacity.
5. **No PII leaks:** open the site in a fresh window. Form fields should be empty. Type something, close the tab, reopen — fields should be empty again. (Sign-in round-trip persistence is sessionStorage-only and is wiped after resume.)

---

## 9. Flier / poster mode

The `flier` event type is selectable in the filter bar at `/create`. No flier templates ship yet — pick "Flier / Poster", then use the **Upload your own** tile to upload a flier image (PNG/JPG). The studio can annotate any uploaded design the same way it annotates a stock template.

Flier-specific form fields: `eventName` (headline), `subtitle`, `cta`. Only `eventName` is wired into the overlay's `event_title` text source today; mapping `subtitle` and `cta` to text sources is on the Phase 3 list.

---

## 10. How `/_studio` stays hidden

- The route is at `/_studio`, not advertised anywhere in the public app.
- `public/robots.txt` blocks `/_studio*` from search-engine crawlers.
- Pages inside the studio inject `<meta name="robots" content="noindex,nofollow,noarchive">`.
- The admin API has `include_in_schema=False` so it doesn't appear in `/docs`.
- Every admin endpoint returns **404** (not 401/403) on a missing or wrong `X-Admin-Secret` header — including endpoints that take a request body (the secret check is a FastAPI dependency that fires before Pydantic validation).

In short: a curious visitor who types `/_studio` sees a password prompt with no branding. A scanner probing the API gets 404s indistinguishable from a missing route. Only knowledge of the `ADMIN_SECRET` reveals anything.

---

## 11. Removing the studio module

The studio is built as a self-contained, removable module.

To remove it entirely:
1. Delete `backend/admin/` (folder).
2. In `backend/main.py`, remove the two lines tagged `# admin module (removable)`.
3. Delete `src/admin/` (folder).
4. In `src/App.tsx`, remove the two lines tagged `// admin module (removable)`.
5. Optional: remove the `/_studio` rule from `public/robots.txt`.

The public site continues to work — `FinalPreview` and `CreateEvite` fall back to the legacy bottom-left gradient overlay when the `/templates/layouts` endpoint is gone.

---

## 12. Common pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| All pages are blank, no errors in console | Frontend env vars missing | Create `.env.local` per §4 |
| `Module not found: supabase` on backend start | Python deps not installed | `pip install -r requirements.txt` inside the activated venv |
| `/_studio` keeps showing the password prompt | Wrong `ADMIN_SECRET`, or backend not running | Check `backend/.env` and confirm backend is on `:8000` |
| Studio "Save" button does nothing | Backend running but unable to write `layouts.json` | Check folder permissions on `backend/admin/` |
| Live preview shows the old bottom-left gradient | No layout saved for that template yet | Annotate it in the studio first |
| Suggest dialog says "no image provided" in Claude | Image bytes didn't end up on the clipboard | Use the **⬇ Download image** fallback button |
| Suggest dialog parser errors | LLM returned malformed JSON | Click **← Back**, edit the raw response in the textarea, click **Parse →** again; the normalizer tolerates camelCase and missing fields |
| Frontend dev server is on `:5174` instead of `:5173` | Port 5173 is in use (zombie from a previous run) | Find the PID with `netstat -ano \| grep 5173` and kill it, or just use `:5174` |
| `Address already in use` for `:8000` | Same | Same |

---

## 13. File map (the bits worth knowing)

```
backend/
  main.py                       # FastAPI entry, mounts all routers
  config.py                     # env loader (ADMIN_SECRET lives here)
  admin/                        # studio backend module (removable)
    router.py                   # /admin/* and /templates/layouts
    service.py                  # JSON file storage
    schemas.py                  # Pydantic models for Zone/Line/Polygon/etc
    llm.py                      # Anthropic + Ollama client
    layouts.json                # the actual saved annotations (gitignored)

src/
  pages/CreateEvite.tsx         # end-user create flow
  sections/create/
    TemplateOverlay.tsx         # renders polygon-following text + curves
    MessageOverflow.tsx         # the "designs that fit" picker
  data/
    eventFields.ts              # event types incl. flier
    eviteTemplates.ts           # the template catalog
  lib/
    templateLayouts.ts          # fetch + cache layouts from the backend
    templateCapacity.ts         # per-template character capacity calc
    fontLoader.ts               # the 12 Google Fonts
  admin/                        # studio frontend module (removable)
    index.tsx                   # admin routes
    pages/
      TemplatesList.tsx         # grid view of all templates
      TemplateAnnotator.tsx     # the per-template editor
      Settings.tsx              # LLM provider picker
    components/
      ZoneCanvas.tsx            # draggable polygon canvas
      SuggestDialog.tsx         # AI suggest flow (handles L1/L2/L3)
      PalettePicker.tsx         # color sampler
      SecretGate.tsx            # the admin-secret prompt
    lib/
      adminClient.ts            # fetch wrapper with X-Admin-Secret
      normalizer.ts             # tolerant LLM-response parser
      settings.ts               # per-browser LLM provider config

RUNBOOK.md                      # this file
```

---

## 14. Reporting issues to Claude / the implementer

When something is off, include:
1. The URL you were on.
2. What you did, expected, observed.
3. Screenshot of the page.
4. **Browser DevTools Console** errors (red lines).
5. **Backend terminal output** since you reproduced the bug (the uvicorn log).
6. For studio issues: which provider you have selected in Settings.

The more specific, the faster the fix.
