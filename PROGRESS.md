# Moments & Memories - Progress & Design Context

## [2026-03-04] - Full Codebase Analysis & Design Research
**Status**: Completed

---

## 1. PROJECT OVERVIEW

**Occasio** is a luxury event planning website — "The Celebration Canvas Experience"
- **Stack**: React 19 + TypeScript + Vite 7 + Tailwind CSS 3 + shadcn/ui (40+ components)
- **Animation**: GSAP + ScrollTrigger + Lenis smooth scroll + Framer Motion
- **Sections**: Navigation > Hero > Timeline > Invitations > ChapterTransition > DecorGifts > QuoteSection > Footer

---

## 2. CURRENT DESIGN SYSTEM

### 2.1 Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `background-dark` | `#211119` | Primary dark bg (wine/burgundy-black) |
| `background-light` | `#f8f6f7` | Light alternative |
| `stone-matte` | `#EADDD7` | Timeline, DecorGifts, QuoteSection bg (warm stone) |
| `fluid-dark` | `#0f050a` | Deep dark accent |
| `primary` | `#e61980` | Hot pink — CTAs, accents, chapter labels |
| `primary-foreground` | `#ffffff` | White on primary |
| CSS var `--background` | `330 30% 9%` | HSL dark base |
| CSS var `--primary` | `330 85% 50%` | HSL pink |
| CSS var `--border` | `330 20% 20%` | Subtle borders |
| `liquid-bg` | animated conic-gradient + radial glow | Hero background |
| Glass panel | `rgba(255, 255, 255, 0.03)` + `blur(6px)` | Card backgrounds |

### 2.2 Typography

| Font | Family | Source | Usage |
|------|--------|--------|-------|
| **Bodoni Moda** | Serif (Didone) | Google Fonts | Main headings via `font-serif-exp` |
| **Playfair Display** | Serif | Google Fonts | Fallback for `font-serif-exp` |
| **Space Grotesk** | Sans-serif (geometric) | Google Fonts | Body text, display, `.font-display` |
| **Ragika** | Serif | Custom `.ttf` | Accent/decorative |
| **Ciguatera** | Display | Custom `.otf` | Nav logo "OCCASIO", section labels |
| **Agatho** | Serif | Custom `.otf/.ttf` | Accent text in Invitations, DecorGifts |

### 2.3 Current Animations & Transitions

#### Hero:
- **Background**: Animated rotating conic-gradient (`liquid-rotate` 20s) + floating radial glow (`liquid-pulse` 8s)
- **Floating images**: 5 organic blob-shaped images with staggered bloom entrance (scale+blur+brightness), CSS float animations, parallax+fade on scroll
- **Title**: `opacity 0→1, y 60→0` entrance (1.2s), scrubbed fade+slide on scroll
- **Section exit**: Pin + scale 0.92 + opacity 0.3 + borderRadius 24px (scrub: 0.6)

#### Timeline:
- **Section entrance**: ClipPath reveal `inset(8% 4% 8% 4% round 24px)` → `inset(0% 0% 0% 0% round 0px)` (scrub: 0.6)
- **Content exit**: `opacity: 0.4, y: -30` scrubbed fade at bottom
- **Heading**: `opacity 0→1, y 30→0`
- **SVG path draw**: strokeDashoffset scrub
- **Dots**: `scale 0→1` with back.out(3)
- **Images**: `scale 0→1, x ±24→0` bloom from dot
- **Text**: blur(14px)→blur(0px) invisibility cloak reveal

#### Invitations:
- **Heading**: `opacity 0→1, y 80→0` (start: top 95%)
- **Cards stagger**: `opacity 0→1, y 80→0, scale 0.95→1`
- **Parallax**: y -30/-50 scrub
- **Tilt**: Framer Motion 3D tilt on hover
- **Spotlight**: cursor-following radial gradient

#### ChapterTransition:
- **Scrubbed timeline**: Single scrubbed GSAP timeline (scrub: 0.8)
- **Lines**: `scaleY 0→1`
- **Chapter label**: `opacity 0→1, y 20→0`
- **TextEffect**: Framer Motion per-word blur-slide, triggered at progress > 0.3

#### DecorGifts:
- **Section entrance**: ClipPath reveal `inset(12% 8% 12% 8% round 32px)` → `inset(0%)` (scrub: 0.8)
- **Heading**: trigger at 'top 65%'
- **Image parallax**: y -40 scrub
- **Grayscale→color on hover**: 700ms transition

#### QuoteSection:
- **Background**: Solid stone `#EADDD7` (matches DecorGifts seamlessly)
- **Quote**: Scrubbed fade+slide entrance (scrub: 0.6)
- **Decorative lines**: ScaleX 0→1 grow inward (scrub: 0.6)
- **Text**: Dark colored (`text-background-dark/80`) against stone bg

#### Footer:
- **Section entrance**: Scrubbed `opacity 0.5→1, y 40→0` (scrub: 0.5)
- **Content**: Cascading triggers at 60%/55%/50%/45%

#### Gradient Bridges (App.tsx):
- **Stone→Dark**: 8-stop gradient `#EADDD7 → #d4c0b8 → #b8948a → #8a5c5e → #5c3040 → #3a1a2a → #2a1520 → #211119`
- **Stone→Black**: 8-stop gradient `#EADDD7 → #d4c0b8 → #b09080 → #7a5860 → #4a2838 → #2c1520 → #160a0e → #000000`

---

## 3. SECTION TRANSITION MAP (Current)

```
Hero (dark, animated liquid-bg + floating image collage)
  |-- pin, scale 0.92, opacity 0.3, borderRadius 24px (scrub exit)
  v
Timeline wrapper (bg-[#EADDD7] — eliminates dark bleed through clipPath)
  Timeline (stone #EADDD7, clipPath reveal entrance)
  |-- content exit fade at bottom
  v
Gradient Bridge: Stone → Dark (8 color stops, 30-50vh)
  v
Invitations + ChapterTransition (dark #211119, shared surface)
  |-- subtle radial gradient overlay
  v
DecorGifts (stone #EADDD7, clipPath reveal entrance)
  v
QuoteSection (solid stone #EADDD7, dark text)
  v
Gradient Bridge: Stone → Black (8 color stops, 25-40vh)
  v
Footer (black, scrubbed entrance)
```

**No hard color breaks remaining** — all transitions use gradient bridges or clipPath reveals

---

## 4. COMPLETED WORK LOG

### [2026-03-05] — Phase 1-8: Page Transitions + Font Upgrade
**Status**: Completed

- Phase 1: App.tsx layout restructure (gradient bridges, z-index, Lenis config)
- Phase 2: Hero→Timeline transition (pin+scale exit, clipPath entrance)
- Phase 3: Invitations heading trigger timing adjustment
- Phase 4: ChapterTransition scrub conversion
- Phase 5: DecorGifts clipPath reveal
- Phase 6: Footer scrubbed entrance
- Phase 7: CSS cleanup (removed scroll-behavior: smooth)
- Phase 8: Font upgrade (Bodoni Moda + custom font families)
- Bug fix: React.Fragment key warning in Timeline

### [2026-03-06] — Visual Polish: Blending Fixes + Hero Gallery Redesign
**Status**: Completed

#### What Was Done:

**1. Hero Gallery — Complete Redesign**
- **Removed**: Heavy 3D WebGL `InfiniteGallery` (three.js Canvas with floating plane shader)
- **Replaced with**: Pure CSS/GSAP floating image collage
  - 5 organic blob-shaped images scattered around "Occasio" title
  - Each image: unique border-radius (blob shape), mix-blend-luminosity, reduced opacity (50%), warm tint overlay
  - GSAP staggered bloom entrance: `scale 0.6→1, blur 12px→0, brightness 0.5→1` (1.4s each, staggered delays)
  - CSS float animations: `animate-float-slow/medium/fast` (5-8s infinite)
  - Scroll parallax: `y -60 to -120, opacity→0.2` scrubbed
- **Benefits**: Much lighter (no WebGL), more elegant, organic shapes fit luxury aesthetic

**2. Hero Background Animation**
- **Before**: Static `liquid-bg` with fixed conic-gradient
- **After**: Animated `liquid-bg` with two pseudo-elements:
  - `::before` — Rotating conic-gradient (`liquid-rotate` 20s linear infinite)
  - `::after` — Floating radial glow (`liquid-pulse` 8s ease-in-out infinite, drifts and breathes)
- Added vignette overlay for cinematic depth
- Fixed z-index layering for gallery images above pseudo-elements

**3. QuoteSection — Complete Rework**
- **Before**: `bg-gradient-to-b from-background-dark to-[#EADDD7]` (dark→stone) creating ugly dark sandwich between two stone sections
- **After**: Solid `bg-[#EADDD7]` matching DecorGifts seamlessly
- Quote text: Changed from `text-white/90` to `text-background-dark/80` (dark on stone)
- Added decorative horizontal lines that grow inward on scroll (scaleX 0→1, scrub: 0.6)
- Added stone texture overlay for consistency with other stone sections
- Converted animations from toggle-based to scrubbed (scroll-linked)

**4. Gradient Bridges — Smoother Blending**
- **Before**: 3 color stops each (harsh banding visible)
- **After**: 8 color stops each (smooth perceptual transition)
- Stone→Dark: `#EADDD7 → #d4c0b8 → #b8948a → #8a5c5e → #5c3040 → #3a1a2a → #2a1520 → #211119`
- Stone→Black: `#EADDD7 → #d4c0b8 → #b09080 → #7a5860 → #4a2838 → #2c1520 → #160a0e → #000000`

**5. Timeline Blending Fix**
- **Before**: Timeline wrapper had no bg color → clipPath revealed dark Hero background through corners
- **After**: Timeline wrapper gets `bg-[#EADDD7]` → clipPath reveals stone-on-stone (no dark bleed)

**6. Dark Wrapper Overlay Fix**
- **Before**: Used `liquid-bg` class (now has animated pseudo-elements → would create unwanted animation)
- **After**: Replaced with static subtle radial gradient overlay (pink + wine glow)

#### Files Changed:
- `src/sections/Hero.tsx` — Complete rewrite: removed 3D WebGL gallery, replaced with CSS floating image collage + GSAP bloom animations
- `src/sections/QuoteSection.tsx` — Complete rework: stone bg, dark text, decorative lines, scrubbed animations
- `src/App.tsx` — Timeline wrapper bg-[#EADDD7], dark wrapper overlay fix, smoother gradient bridges (8 stops)
- `src/index.css` — Animated `liquid-bg` (::before rotating conic, ::after pulsing glow), new keyframes (liquid-rotate, liquid-pulse)

#### Verification:
- Dev server running on port 5173
- Zero console errors after full page reload
- All section transitions smooth and seamless
- No dark bleed through clipPath reveals
- No hard color breaks between sections

---

## 5. POTENTIAL NEXT STEPS

1. **Kinetic typography** — Large "OCCASIO" text sliding across during ChapterTransition
2. **Velocity-based skew** — Elements tilt based on scroll speed for physicality
3. **Horizontal scroll gallery** — Convert Invitations to museum-style horizontal scroll
4. **Lenis ticker sync** — `gsap.ticker.add()` for tighter frame sync
5. **Mobile responsiveness audit** — Test on smaller viewports
6. **Performance profiling** — Test on mid-range mobile devices

### [2026-03-07] — Dev Server Fix
**Status**: Completed

#### What Was Done:
- **Fixed**: `preview_start` failing with `spawn npm ENOENT` on Windows
- **Root cause**: Windows cannot directly spawn `npm` — needs `cmd /c npm`
- **Fix**: Updated `.claude/launch.json` to use `"runtimeExecutable": "cmd"` with `"runtimeArgs": ["/c", "npm", "run", "dev", "--", "--port", "5173"]`
- Dev server confirmed running on port 5173

#### Files Changed:
- `.claude/launch.json` — Changed runtimeExecutable from `npm` to `cmd` with `/c` prefix arg for Windows compatibility

---

## Key Files Reference
- `src/App.tsx` — Root component, Lenis + GSAP setup, section layout, gradient bridges
- `src/sections/` — All page sections (Hero, Timeline, Invitations, ChapterTransition, DecorGifts, QuoteSection, Footer, Navigation)
- `src/components/ui/` — 57 UI components (40+ shadcn + custom animation components)
- `tailwind.config.js` — Theme colors, fonts, keyframes, animations
- `src/index.css` — CSS variables, font-faces, custom classes, keyframes, liquid-bg animation
- `src/App.css` — Glass morphism, parallax, button effects

---

## [2026-04-19] - Full Backend Design
**Status**: Design Complete, Implementation Starting

**What was done**:
- Explored existing Supabase — found 7 tables (6 belong to separate Costco scanner project, only `users` is reused)
- Designed full FastAPI + Supabase backend with domain modules
- Created spec: `docs/superpowers/specs/2026-04-19-backend-design.md`

**Architecture**:
- FastAPI (Python) with domain modules: auth, events, qr, shop, users, notifications, analytics
- Supabase PostgreSQL for storage + Realtime for QR contact sync
- Every step logs to `logs` table via middleware

**New tables to create**:
`events`, `event_invitees`, `qr_contact_sessions`, `shop_items`, `orders`, `order_items`, `notifications`, `logs`

**Key features**:
1. Event/evite CRUD with invitee management
2. QR Contact Import: laptop shows QR → phone scans → Web Contact Picker API → contacts sync via Supabase Realtime
3. Gift shop with orders
4. Notifications: email (SendGrid), SMS (Twilio), WhatsApp deep links, Instagram copy
5. Admin-only analytics dashboard
6. Full logging on every API step

**Files changed**:
- `docs/superpowers/specs/2026-04-19-backend-design.md` (created)
- `PROGRESS.md` (updated)

**Next steps**:
- Scaffold `backend/` FastAPI project
- Create Supabase migrations for all new tables
- Implement modules in order: auth → events → qr → shop → notifications → analytics

## [2026-04-19] - Backend Implementation Complete
**Status**: Completed

**What was done**:
- Built full FastAPI backend (Tasks 1-13) with domain modules: auth, users, events, qr, shop, notifications, analytics
- 45 tests passing, all modules covered
- Supabase migrations: 9 SQL files for all new tables
- QR contact import flow: session → QR image → mobile HTML with Web Contact Picker API → Supabase Realtime
- Logging middleware auto-logs every request + business events to `logs` table
- Admin-only analytics dashboard protected by X-Admin-Secret header

**Files created**:
- `backend/` — full FastAPI project (main.py, config.py, database.py, middleware/, auth/, users/, events/, qr/, shop/, notifications/, analytics/)
- `backend/migrations/` — 9 SQL migration files
- `backend/tests/` — full test suite (45 tests)

**Next steps**: ~~Run migrations~~ ✓ | ~~Deploy backend~~ ✓ | ~~Wire Realtime QR~~ ✓

---

## [2026-04-19] - QR Flow Fixes & Mobile Polish
**Status**: Completed

**What was done**:
- Fixed 403 on QR session (HTTPBearer auto_error=False)
- Fixed 401 even when logged in (Supabase uses ES256 — switched to db.auth.get_user)
- Fixed Realtime WebSocket failing (anon key had trailing newline — added .trim())
- Fixed QR contacts never arriving (api_base was missing /api prefix)
- Fixed Next button silently blocked (validateGuests relaxed)
- Restyled mobile QR page to match website (dark green theme)
- Added session status check on page load (expired / already-used screens)
- Added iOS vCard upload flow (POST /api/qr/import/{token}/vcf + vCard parser)
- Added public GET /api/qr/status/{token} endpoint
- Fixed Android edge cases: empty selection, multi-value contacts, network errors

**Files changed**:
- `backend/middleware/auth.py`, `backend/qr/router.py`, `backend/qr/service.py`
- `backend/qr/templates/contact_import.html`
- `src/lib/supabase.ts`, `src/sections/create/GuestDetails.tsx`, `src/pages/CreateEvite.tsx`

---

## [2026-04-19] - Draft Saving, Dashboard & Auth Gate — PLANNED
**Status**: Plan written, not yet implemented

**Plan**: `docs/superpowers/plans/2026-04-19-draft-dashboard-auth-gate.md`

**What will be built**:
1. **Auth gate** — ProtectedRoute redirects unauthenticated users from /create to /signin?redirect=/create; after login they land at destination
2. **Draft auto-save** — CreateEvite debounce-saves all state to new `event_drafts` Supabase table (2s after any change)
3. **Continue prompt** — On return to /create, fetches draft and shows "Continue your evite?" modal with [Continue] / [Start Fresh]
4. **Dashboard** — /dashboard page: stats bar, active draft card, events list with status badges
5. **Nav link** — Dashboard appears in navigation when logged in

**New files**: `backend/migrations/010_create_event_drafts.sql`, `backend/drafts/` module, `src/components/ProtectedRoute.tsx`, `src/pages/Dashboard.tsx`

**Next steps**: Run Task 1–8 from the plan above

---

## [2026-06-07] - Deployment Architecture Mapped: Production Runs on EC2 (not Vercel)

**Status**: Discovery — context gathered for in-progress custom domain + SSL setup

**What was found**: Despite a linked `.vercel/project.json` (project `momentsandmemories`, → `momentsandmemories.vercel.app`), the **actual production deployment is an AWS EC2 instance**, driven by `.gitlab-ci.yml`:
- **Pipeline**: test → build (Vite `npm run build` → `dist/`) → deploy (only on `main`)
- **Deploy mechanism**: GitLab CI rsyncs `dist/` to `ubuntu@$EC2_HOST:/var/www/momentsandmemories/dist/`, then SSHes in to `git pull origin main`, reinstall backend deps in `venv`, and `sudo systemctl restart momentsandmemories-backend`
- **Backend**: FastAPI service running as systemd unit `momentsandmemories-backend`
- **Frontend**: static `dist/` served by **nginx** (already configured per user, on an **Elastic/static IP**)
- **Confirmed EC2 Elastic IP (from AWS console)**: `13.237.143.52` — region `ap-southeast-2`, instance `i-078eb7e51ce851179`, allocation `eipalloc-0c1dc7a9f1e8c2657`, public DNS `ec2-13-237-143-52.ap-southeast-2.compute.amazonaws.com`. (Note: `16.16.75.33` seen repeatedly in local `~/.ssh/known_hosts` was a wrong guess — NOT the right host; use `13.237.143.52`.) SSH as `ubuntu`, key at `~/.ssh/gitlab_ci_deploy_key` (CI-only key, comment `gitlab-ci-deploy`)

**Domain + SSL setup — ✅ COMPLETED**: Domain **`mymomentsnmemories.com`** (bought via GoDaddy) is now live on the EC2 deployment with HTTPS.
1. ✅ GoDaddy DNS: `@` A record → `13.237.143.52` (root `mymomentsnmemories.com` and the pre-existing `www` CNAME — which aliases to the root — both resolve correctly; domain forwarding/parking disabled)
2. ✅ SSH access fixed: the CI-only `gitlab_ci_deploy_key` doesn't have interactive login rights — the correct key is **`C:\Users\venky\Downloads\momentsandmemories.pem`** (copied to `~/.ssh/momentsandmemories.pem`, `chmod 400`); login as `ubuntu@13.237.143.52`
3. ✅ Backend confirmed running on **port 8000** (`uvicorn main:app --host 127.0.0.1 --port 8000`, systemd unit `momentsandmemories-backend`)
4. ✅ nginx server block added at `/etc/nginx/sites-available/mymomentsnmemories.com` (root `/var/www/momentsandmemories/dist`, `/api/` → `127.0.0.1:8000`), enabled via symlink in `sites-enabled/`
5. ✅ SSL issued via `sudo certbot --nginx -d mymomentsnmemories.com -d www.mymomentsnmemories.com` — cert valid until **2026-09-06**, auto-renewal scheduled by certbot, HTTP→HTTPS redirect (301) auto-configured

**Verified externally**: `https://mymomentsnmemories.com` → 200, `https://www.mymomentsnmemories.com` → 200, `http://...` → 301 redirect to HTTPS. Domain fully live and secured. 🎉

---

## [2026-06-08] - Post-Launch Cleanup: Eliminated Raw-IP Exposure (3 fixes)

**Status**: ✅ COMPLETED

**Problem found**: After going live on the domain, the app still showed the raw EC2 IP (`13.237.143.52`) in the browser when accessed directly, and after login — because three config values still referenced the IP/old Vercel URL instead of the new domain. Traced through `src/pages/SignIn.tsx`/`SignUp.tsx`/`ForgotPassword.tsx` (`redirectTo: window.location.origin`), `backend/main.py` (CORS `allow_origins=[settings.frontend_url]`), and `backend/qr/service.py` (`base = settings.backend_url or settings.frontend_url` — baked into every generated QR code's import URL). **No hardcoded IPs found in source code** — confirmed via full-repo grep; all issues were environment/config values.

**Fixes applied**:
1. ✅ **Supabase Auth → URL Configuration**: Site URL set to `https://mymomentsnmemories.com`; added `https://mymomentsnmemories.com/**` and `www.` variant to Redirect URLs (done via dashboard by user)
2. ✅ **Backend `.env` on EC2** (`/var/www/momentsandmemories/backend/.env`): `FRONTEND_URL` and `BACKEND_URL` were hardcoded to `http://13.237.143.52` — updated to `https://mymomentsnmemories.com` via `sed`, then `sudo systemctl restart momentsandmemories-backend`. **This was a real functional bug**: every QR code generated before this fix encoded the wrong base URL (`http://13.237.143.52/api/qr/import/...`) — guests scanning older QR codes will hit the IP instead of the domain. ⚠️ Old event QR codes may need regeneration.
3. ✅ **nginx catch-all redirect**: Discovered a legacy config `/etc/nginx/sites-enabled/momentsandmemories` with `server_name 13.237.143.52;` (from the pre-domain setup, May 10) that exact-matched bare-IP requests and bypassed any `default_server` block — this was the direct cause of "raw IP shows the site." Fix: removed that symlink (`sudo rm /etc/nginx/sites-enabled/momentsandmemories`; original file kept as backup in `sites-available/`) and added a new `default_server` block (`/etc/nginx/sites-available/catchall-redirect`) that 301-redirects any non-matching Host (including the bare IP) to `https://mymomentsnmemories.com`. Verified: `curl -I http://13.237.143.52/` → `301 Moved Permanently` → `Location: https://mymomentsnmemories.com/`

**Next steps**: ⚠️ Consider regenerating QR codes for events created before this fix (they encode the old IP-based import URL). Then move on to the bulk SMS feature (see `docs/bulk-messaging-options.md`)

---

## [2026-06-21] - GitLab CI Deploy Fix + AWS End User Messaging SMS Setup (in progress)

**Status**: 🔄 IN PROGRESS

**GitLab CI deploy fix — ✅ COMPLETED**: A teammate's push (`eb66430`) broke the `deploy` stage — EC2 had expired GitLab credentials causing `git pull origin main` to fail with `HTTP Basic: Access denied`. Fixed in `.gitlab-ci.yml` (commit `7d917d8`): removed the `git pull` step entirely and replaced it with a second `rsync` that pushes `backend/` directly from CI to EC2 (excluding `venv`, `__pycache__`, `.env`). EC2 no longer needs any GitLab credentials. Verified via pipeline #37 → `success`. Local `gitlab` remote PAT had also expired — rotated to a new token.

**Bulk SMS — AWS End User Messaging SMS setup (US-only for now, per `docs/bulk-messaging-options.md`)**: Decided to use AWS End User Messaging SMS for US guests (Twilio remains wired in code but unused/unconfigured; India SMS deferred — would need MSG91 + DLT registration, not pursued yet since current audience is USA-only).

Completed so far:
1. ✅ **Toll-free number requested**: `+18556299508` (US), status `Pending` carrier registration — registration ID `registration-e2b6a0b6872c492bad4f9894d8442997`, submitted via AWS End User Messaging console (Phone numbers → Request originator → Toll-free)
2. ✅ **SMS sandbox exit + spend threshold increase requested**: AWS Support case `178198657900903` (Service Quota increase, "SMS Production Access" = 1, region `ap-southeast-2`) — status `Work in progress`. Not urgent — app is still in testing, sandbox + simulator numbers are sufficient for now.
3. ✅ **IAM user created**: `momentsandmemories-backend` with custom policy `momentsandmemories-sms-send` (`sms-voice:SendTextMessage`, `sms-voice:DescribePhoneNumbers`). Access key generated and stored in `vercel.env` (gitignored — added `vercel.env` to `.gitignore`, it was previously untracked-but-NOT-ignored, a latent leak risk fixed in this session) and wired into `backend/config.py` as `aws_sms_access_key_id` / `aws_sms_secret_access_key` / `aws_sms_region` / `sms_origination_number`.

4. ✅ **SMS sending code written**: `backend/notifications/service.py` now uses `boto3`'s `pinpoint-sms-voice-v2` client (`_get_sms_client()` helper) for both `send_notification()` (single SMS) and `_do_bulk_send()` (bulk SMS), calling `send_text_message(DestinationPhoneNumber, OriginationIdentity, MessageBody)`. **Twilio fully removed** (was unconfigured/unused dead code) — `config.py` twilio_* settings removed, `twilio==9.3.0` dropped from `requirements.txt`, test updated to mock `boto3` instead of `Client`. All 60 backend tests pass. (Found + fixed along the way: local venv was stale and missing `boto3` entirely — reinstalled via `pip install -r requirements.txt`.)

**Next steps**:
- ⏳ Test end-to-end using an AWS *simulator* number (toll-free is still Pending, can't verify a real destination number until it's Active)
- ⏳ Once toll-free registration approves (carrier review, up to 15 business days) and the Support case clears, switch from simulator to the real toll-free number — just a config change
- ⚠️ Compliance note: current opt-in model is host-provided contact info (manual entry or QR-code import from host's phone) — NOT guest self-opt-in. Selected `QR_CODE` as Opt-in type on the registration form. Consider adding a soft double opt-in (e.g. first message asks "Reply YES for updates") to reduce future spam-complaint/suspension risk.

---

## [2026-06-21] - Canvas Template Editor (Feature 1 of 4) — Build Your Own Design

**Status**: ✅ COMPLETED (local only — branch `feature/canvas-template-editor`, **not pushed**, per explicit instruction)

Researched competitor evite editors first (`docs/evite-editor-research.md`), planned the integration against the full codebase (`docs/canvas-editor-plan.md`), then built a Konva-based "Build Your Own Design" canvas editor as the first of four planned features (others queued: event website builder, page-turn book invitation, guest photo gallery auto-collage).

**Database (new tables only — no existing table touched)**:
- `backend/migrations/014_create_media_uploads.sql` — `media_uploads` table + RLS, owner-only
- `backend/migrations/015_create_user_templates.sql` — `user_templates` table (holds the `event_id` FK pointing *at* `events`, so the existing `events` table needed zero changes) + RLS
- `backend/migrations/016_create_user_uploads_bucket.sql` — new public Storage bucket `user-uploads` (`{user_id}/{filename}` path convention) + owner-scoped storage policies
- All three applied to the live Supabase project via MCP; verified no impact on existing tables/policies.

**Backend** (`backend/media/`, `backend/custom_templates/`, registered in `main.py`):
- `POST /media/upload`, `GET /media`, `DELETE /media/{id}` — multipart upload to Supabase Storage, validates mime type + size (10MB image / 50MB video), inserts `media_uploads` row.
- `POST/GET/PUT/DELETE /custom-templates` — CRUD for `user_templates`, ownership-checked on every read/write.
- 13 new pytest tests (`test_media.py`, `test_custom_templates.py`), full suite **73/73 passing**.

**Frontend** (`src/components/CanvasEditor/`, wired into `src/pages/CreateEvite.tsx`):
- Konva/react-konva Stage+Layer editor: add/edit text (font, size, color, align, bold/italic/underline, inline double-click editing), add image/video, drag/resize/rotate via Transformer, layer panel (select/lock/duplicate/delete/reorder), background color, debounced autosave to `/custom-templates`.
- New gallery tile "Build Your Own Design" sits next to the existing "Upload Your Own Design" tile, same dashed-border visual language — zero changes to existing tile/template-picker behavior.
- On "Done": flattens the canvas to a PNG (`stage.toDataURL()`) and hands off into the **existing, unmodified** event-details → guests → preview → payment flow by reusing the existing `uploadedTemplate` state shape — no changes needed to `TemplateRenderer.tsx` or downstream steps.
- Styled to match the app's existing dark-green/serif editorial design system (verified visually via Playwright screenshots — not generic/pixelated).

**Testing**: Playwright installed (`@playwright/test`, chromium only). `tests/e2e/canvas-editor.spec.ts` — 9 passing tests (open/close, add text, property edits, duplicate/delete, lock, background color, Done-disabled-when-empty, handoff). `tests/e2e/visual-check.spec.ts` — manual visual-review screenshots + 2 regression tests confirming the pre-existing template-picker and upload-your-own flows are unaffected. Frontend vitest (7/7) and backend pytest (73/73) both green after the change — no regressions found.

**Known scope boundaries** (flagged, not blockers):
- Authenticated persistence (real Storage upload + real `user_templates` row creation) is verified at the backend-logic level (mocked-DB pytest) but not via a live signed-in Playwright session — would require a disposable test Supabase auth account, not created without asking first.
- The flattened design handoff currently uses a local data: URL (same limitation the existing plain-upload flow already has — not a regression).
- The `leonxlnx/taste-skill` GitHub repo could not be installed as an actual Claude Code Skill (no `SKILL.md` at the expected path); its design principles were applied manually by matching the app's existing visual language instead.

**Next steps**: Build feature 2 of 4 (event/wedding website builder), same process — plan → build → backend+frontend → Playwright test → manual/regression check — before moving to feature 3.

---

## [2026-06-21] - Features 2, 3, 4 + Video Bugfix — All 4 Planned Features Complete

**Status**: ✅ COMPLETED (local only — branch `feature/canvas-template-editor`, **not pushed**, per explicit instruction)

Continued straight on from Feature 1 in the same session. Fixed one real bug found in Feature 1, then built Features 2, 3, and 4 back to back, same plan→build→test→verify cycle each time.

**Bugfix — canvas editor video rendering**: `ImageNode.tsx` used `useImage`+`Konva.Image`, which only works for static images — uploaded video files silently failed to render despite the tile advertising "Video". Fixed by adding `VideoNode.tsx` (HTMLVideoElement + `Konva.Animation` loop, the standard Konva pattern for drawing live video frames to canvas) and a `mediaKind: 'image' | 'video'` field on `ImageElementData` so the renderer picks the right node type. Verified with a real generated test video (ffmpeg) through a mocked-upload Playwright test — confirmed the video frame actually paints on the canvas (screenshot evidence), not just that nothing crashes.

**Feature 2 — Event/Wedding Website Builder** (`backend/event_websites/`, `src/components/WebsiteBuilder/`):
- New table `event_websites` (slug, sections JSONB, theme JSONB, published) — zero changes to `events`.
- Section-based builder (not canvas) — 8 section types: Hero, Our Story, Schedule, Photo Gallery, RSVP, Map/Venue, FAQ, Custom Text. Add/reorder/edit/remove sections, live preview, slug editor, publish toggle, autosave.
- Public route `/w/:slug` (no auth) renders the published site in a clean cream/serif wedding-website aesthetic (deliberately different from the app's dark editor chrome — appropriate for a guest-facing page, confirmed visually).
- 8 new pytest tests, 4 new vitest component tests (`WebsiteBuilder.test.tsx`, using `@testing-library/react` since this UI has no canvas), 6 new Playwright tests + 1 visual screenshot test.
- Entry point: new "Website" button per event row in Dashboard.

**Feature 3 — "Book" page-turn invitation** (`backend/invitation_books/`, `src/components/BookBuilder/`):
- New table `invitation_books` (ordered `pages: [{id, image_url}]`, published) — self-contained, doesn't depend on `media_uploads` or `user_templates`.
- `react-pageflip` integration (`BookViewer.tsx`) — upload page images, reorder/delete, live page-turn preview.
- Public viewing: a "View Invitation Book" button appears on the existing `/event/:eventId` page when a published book exists; opens a full-screen `BookViewer` modal.
- **Verified the actual page-turn interaction**, not just that the component mounts — clicked the book and confirmed via before/after screenshots that it visually flips from page 1 to page 2.
- 7 new pytest tests, 3 new Playwright tests.
- Entry point: new "Book" button per event row in Dashboard.

**Feature 4 — Guest photo gallery → auto-collage** (`backend/gallery/`, `src/components/GuestGallery/`, `src/pages/GuestGalleryUpload.tsx`):
- New table `event_gallery_photos` — deliberately self-contained (own `storage_path`/`public_url` columns) rather than referencing `media_uploads`, because `media_uploads.user_id` is `NOT NULL` (owner-scoped) and guests contributing photos have no account. Uploads go through the backend's service-role client, which bypasses Storage/Table RLS, so no anonymous-write policy was needed.
- No-login guest upload page at `/gallery/:eventId` — guest enters a name (remembered in `localStorage`), uploads photos, sees the live masonry gallery (CSS `columns-N` layout — the well-understood, no-AI approach the research confirmed was right) update immediately.
- Host moderation: new "Guest Gallery" tab in the Dashboard's expanded event row (alongside the existing Analytics/Messages tabs) — approve/hide/delete, copy guest upload link.
- **Cross-feature integration**: the Website Builder's "Photo Gallery" section now actually displays real approved guest photos (was a placeholder before Feature 4 existed) — wired via a new optional `eventId` prop on `WebsiteRenderer`.
- 7 new pytest tests, 5 new Playwright tests, 1 visual masonry-layout screenshot (confirmed correct varied-height column layout).
- Entry point: guest-facing `/gallery/:eventId` link (shared by host), moderation tab in Dashboard.

**Final overall regression** (after all 4 features): `tsc -b` clean, production `npm run build` clean (85 backend routes total), backend pytest **95/95 passing**, frontend vitest **11/11 passing**, full Playwright suite **25/25 passing** across all 4 features plus the original pre-existing template-picker/upload-flow regression checks.

**Demo designs**: produced via Playwright screenshot capture rather than seeded live-DB content (no disposable test account was created without asking first) — see `test-results/manual-02` through `manual-14` for canvas editor (empty/styled/layered/video), the handoff into the existing event-details form, the public wedding website rendering, the book viewer before/after a real page flip, and the guest masonry gallery. If real seeded demo data inside the live Supabase project is wanted, that needs either a disposable test auth account or the user's own login.

**Known scope boundaries carried across all 4 features** (consistent with Feature 1's documented gaps):
- None of the 4 features have been exercised end-to-end through a *live authenticated* browser session — all authenticated-path correctness is verified at the backend-logic level (mocked-DB pytest, 95/95) plus frontend mechanics (Playwright, with network calls mocked at the boundary). Real Storage/DB round-trips for owner-authenticated actions were not run against a live signed-in session.
- Feature 2's "RSVP" section and Feature 3's "book pages" don't yet pull live data from a saved canvas-editor design (Feature 1) — pages/sections are populated by direct image upload, not by picking a previously-saved `user_templates` row. Flagged as a possible future enhancement, not built in this pass to keep scope honest.

**Next steps**: none currently planned — all 4 originally-requested features are built, wired, and tested. Awaiting direction on what's next (e.g., code-split the two >500KB chunks, or move to a different feature entirely).

---

## [2026-06-21] - Real Authenticated E2E Pass — Live Supabase Test Account

**Status**: ✅ COMPLETED (local only, **not pushed**)

Per request, created a disposable test login in the live Supabase project and used it to exercise all 4 features through real sign-in, real backend persistence, and real public pages — not mocked network responses. This closed the one gap flagged at the end of the previous entry.

**Test account** (Supabase Admin API, `email_confirm: true`, no email verification needed):
- Credentials live in `.env.e2e-test` (gitignored, never committed) and as a comment block in `backend/.env`.
- One real test event ("E2E Test Wedding", published) was created and is left in the account for future re-runs.
- `tests/e2e/authenticated-real.spec.ts` (new) — 5 tests: dashboard sign-in, Feature 2 (build+publish website, verified via the real `/w/:slug` page), Feature 3 (build+publish book, verified via the real book viewer modal), Feature 1 (canvas autosave, verified via a real `custom_templates` row), Feature 4 (real no-auth guest upload + real host moderation tab). All 5 pass individually; a few don't cleanly chain back-to-back without resetting data first (test-script idempotency against now-existing data, not a product bug).

**Real bug found and fixed**: both `WebsiteBuilder` and `BookBuilder` (`src/components/WebsiteBuilder/index.tsx`, `src/components/BookBuilder/index.tsx`) had the same autosave race condition. Their "skip the first autosave right after load" guard (`skipNextAutosave` ref) was only ever consumed inside the autosave effect, keyed off the `loaded` state transition — not off whether anything was actually fetched. For a **brand-new** event with no existing website/book yet, if a user edited anything (e.g. added a section) before the initial "does one already exist?" fetch resolved, that edit's autosave got silently swallowed: the guard treated the unrelated `loaded` flip as "the load just applied data, skip this one" even though nothing had been applied. Fixed by setting `skipNextAutosave.current = true` only when fetched data is about to be re-applied (existing record found) and explicitly `= false` when there's nothing to skip (new record) — done in the `.then()` callback itself rather than relying on effect-timing. Confirmed via the real test account: before the fix, a section added immediately after opening the builder never persisted; after the fix, it does.

**Environment finding (not a product bug, but worth knowing)**: `.env.local` at the project root pins the frontend dev server to `VITE_API_URL=http://localhost:8005` (not the `.env` default of 8000) — match this when running a local backend for manual/E2E testing. Also found that a single long-running local `uvicorn` process, after several hours of heavy repeated testing in this session, started intermittently 500-ing on calls to Supabase with `WinError 10035` (a Windows-specific stale-socket error from the underlying httpx connection pool) — alternating with successful 200s on the same endpoint. Restarting the backend process resolved it immediately. This is most likely a Windows-specific manifestation of httpx/httpcore connection-pool staleness under long-lived processes; worth a follow-up to add connection pool limits/keep-alive expiry to the Supabase client if this is ever observed in production logs, but not changed here since it didn't reproduce deterministically and a restart is a full mitigation.

**Cleanup**: all test-created rows (website, book, custom template, gallery photo) were deleted via the same account's own API calls after verification, leaving only the one disposable test event behind for future reuse.

---

## [2026-06-21] - Manual QA Pass: Real Sample Content + Two More Real Bugs Fixed

**Status**: ✅ COMPLETED (local only, **not pushed**)

Follow-up to the previous entry — rebuilt real sample content for all 4 features (this time *leaving it in the account*, not deleting it, so it can be inspected directly), verified persistence by reloading/navigating away and back, and screenshotted every step. Found and fixed two more real bugs along the way.

**Real bug #1 — overlapping canvas elements** (`src/components/CanvasEditor/index.tsx`): `addText` and `handleFileChosen` always placed new elements at the exact same fixed center coordinate. Adding two text elements (or two images) produced two fully overlapping, illegible elements — confirmed visually via screenshot. The `duplicateElement` function already offset copies by `+20/+20`; `addText`/`handleFileChosen` never did. Fixed by adding a small cascading offset based on element count. While fixing this, also found and fixed a **stale-closure risk**: both functions computed their offset/z-index from the outer `elements` closure instead of from `setElements`'s own `prev` argument — safe today but a latent bug, especially in `handleFileChosen` (async — the closure could be stale by the time the upload's `await` resolves if the user added something else in the meantime). Moved both computations inside the state updater.

**Real bug #2 — no retry on transient public-page errors** (`src/lib/api.ts`): the 5 public (no-auth) read endpoints (`getPublicEvent`, `getRSVPPage`, `getPublicWebsite`, `getPublicBook`, `getGalleryPhotos`) each did a bare `fetch()` with zero retry. During this session, the local backend's Supabase connection intermittently 500'd (see the `WinError 10035` finding in the previous entry) — when that happened on a guest's *first* page load, the page permanently showed "this event is not available" with no way to recover short of a manual refresh, even though the very next request to the same URL would have succeeded. Added a shared `publicGet()` helper that retries up to 3 times with a short backoff on 5xx (not on 4xx — a real 404 shouldn't retry), and pointed all 5 endpoints at it. This is a genuine resilience improvement regardless of whether the underlying connection-pool issue is fixed later — transient backend hiccups are a fact of life in production too.

**Confirmed working and saving, for real, via direct database checks at every step**:
- **Canvas editor**: 2-text-element design with a custom font size, persisted to `custom_templates`, correct (non-overlapping) positions confirmed in the stored JSON.
- **Website builder**: 4-section site (Hero, Our Story, Schedule, RSVP) at slug `sarah-and-james-wedding`, published, confirmed live and rendering correctly at the real `/w/sarah-and-james-wedding` page.
- **Invitation book**: 2 real uploaded pages, published, confirmed live in the real page-turn viewer on the event's public page.
- **Guest gallery**: 2 real guest-uploaded photos (no login), confirmed still present after a full page reload (proof it's server-persisted, not just local React state), confirmed visible in the host's moderation panel.

**Environment note**: also hit a *separate* one-off issue where the public website page rendered nothing (stuck on the outer Suspense fallback, lazy `import()` never resolving) — traced to a stale Vite dependency-optimization cache in one specific spawned dev-server instance (confirmed by starting a fresh `npm run dev` manually, which worked immediately). Not a code bug; just another symptom of having started and torn down dozens of separate dev-server processes today. If this happens again, restart the Vite dev server (or delete `node_modules/.vite` and restart).

**What's currently live in the test account** (left in place — sign in with the credentials in `.env.e2e-test` to inspect directly): one published website at `/w/sarah-and-james-wedding`, one published 2-page invitation book on the test event's public page, one 2-element canvas template, and 2 real guest gallery photos.

---

## [2026-06-21] - User Feedback Pass: Real Production Bugs Found + Website/Gallery Hidden

**Status**: ✅ COMPLETED (local only, **not pushed**)

User did real manual testing after the above pass and reported a CORS error on `/event-websites` plus "designs disappear when I come out of building." Both led to real, now-fixed bugs — more serious than anything found in automated testing so far.

**Real bug #1 — intermittent 500s on outbound Supabase calls, surfacing to the browser as CORS errors** (`backend/database.py`): the long-suspected `httpx.ReadError: [WinError 10035]` (stale pooled connection) finally got root-caused and fixed instead of just worked around with restarts. When the backend's outbound Supabase call failed mid-flight, FastAPI's unhandled-exception path returned a 500 that never got CORS headers attached — Chrome reports that as a CORS policy failure, which is misleading (it's not a CORS misconfiguration at all). Fixed by passing `ClientOptions(headers={"Connection": "close"})` to `create_client()`, forcing httpx to open a fresh connection per request instead of reusing a pooled one. **Verified**: 200/200 rapid sequential requests with zero failures after the fix (previously this failed within the first few dozen requests on a freshly restarted backend).

**Real bug #2 — closing any builder loses an edit made in the last ~1.5s** (`CanvasEditor`, `WebsiteBuilder`, `BookBuilder`): this was the literal cause of "designs disappearing." All three builders debounce autosave by 1.5s. The close button (`onClose`) just unmounted the component with no flush — if you closed within that debounce window, the pending save's `setTimeout` got cleared by the effect's cleanup and the edit was silently dropped, never persisted. Fixed by adding a `handleClose` wrapper in each builder that clears the pending timer and `await`s one final `persist()` before calling the real `onClose`.

**Real bug #3 (found while fixing #2) — no protection against creating two websites/books for the same event** (`backend/event_websites/service.py`, `backend/invitation_books/service.py`): while testing the close-flush fix, tripped a race where editing before the builder's "does a website already exist for this event?" check resolves can create a second, stray `event_websites`/`invitation_books` row instead of updating the real one — there was no backend check preventing it. Fixed two ways: (a) `create_event_website`/`create_invitation_book` now reject a second row for the same `event_id` with a clear 400 error, and (b) `WebsiteBuilder`/`BookBuilder` now show a "Loading…" state and block all editing until the initial existence-check finishes, eliminating the race at the source. Found and cleaned up one real stray duplicate website row that had been silently created earlier in testing.

**Feature visibility change (explicit user request, not a bug)**: the Website Builder entry point ("Website" button) and the Guest Gallery tab were removed from the Dashboard — neither is considered polished enough to show yet. Both features are fully intact in code and still reachable directly: the public website page (`/w/:slug`) and the guest upload page (`/gallery/:eventId`) work exactly as before for anyone with the link; only the host-facing "build/edit" and "moderate" entry points on the Dashboard are hidden. `src/sections/dashboard/GalleryPanel.tsx`'s import was removed from `Dashboard.tsx` since it's now unused there; the component itself wasn't deleted. The corresponding Playwright test for the close-flush fix in `WebsiteBuilder` (`tests/e2e/close-flush-check.spec.ts`) is `test.skip()`'d with a comment explaining why, since it drove the builder through the now-removed button — the underlying fix was confirmed passing before the button was hidden.

**User feedback also flagged, not yet acted on** (recorded here so it isn't lost): canvas editor needs a usable font list (current selection is too small) and the ability to apply font/color changes to *existing* premade templates, not just from-scratch designs; website builder and photo gallery need a visual-quality pass before going back on the Dashboard; all three builders need premade/pre-styled templates instead of starting blank; website builder needs animation options; publish-flow UX needs revisiting. This is a substantial design/scope effort, not a quick fix — see the next entry for how this was scoped and delivered.

---

## [2026-06-21] - Premade Templates / Themes / Frames Across All Three Builders

**Status**: ✅ COMPLETED (local only, **not pushed**)

Direct follow-through on the design-refinement feedback above. Established a shared design brief (palette, font-pairing rules, border/motif treatment — drawn from the app's existing dark editorial UI, not invented from scratch) and used it to scope three parallel workstreams, one per builder, so the output stays visually cohesive instead of three independently-improvised aesthetics. A fourth agent then did an independent, critical live QA + design-review pass against all of it.

**Font list fixed first** (`src/components/CanvasEditor/types.ts`, `PropertyPanel.tsx`, `index.html`): the canvas editor only offered 5 fonts, one of which (`Lora`) wasn't even loaded via Google Fonts — selecting it silently fell back to a generic serif. Expanded to 17 fonts across 3 categorized groups (Serif & Display, Script & Calligraphy, Sans-Serif), all genuinely loaded, with `<optgroup>`s and live per-option font preview in the dropdown.

**Canvas editor — premade templates** (`src/data/canvasTemplates.ts`, `src/pages/CreateEvite.tsx`): added 5 premade templates (wedding, birthday, baby shower, gender reveal, pre-wedding/engagement), each with 2 paired fonts, one accent color, and a hairline border (implemented as a locked, non-draggable image element with an inline SVG data-URI — no `CanvasEditor` core changes needed). A new "Start from a Premade Design" tile sits in the `/create` gallery alongside the existing "Build Your Own Design" (blank) option; picking one opens the same canvas editor pre-loaded with real, fully-editable elements — directly answering the original complaint that existing templates couldn't have font/color changed.

**Website builder — themes, animation, publish UX** (`src/components/WebsiteBuilder/types.ts`, `WebsiteRenderer.tsx`, `index.tsx`): `WebsiteTheme` expanded from `{primaryColor, fontFamily}` to support accent/background colors, separate heading/body fonts, and border style, via a `resolveTheme()` helper that derives the new fields from the old shape when absent — confirmed the one already-published sample site (legacy theme shape) still renders pixel-identical. Added 3 distinct premade presets (Sage Garden, Ivory Classic, Terracotta Bloom) with a swatch picker, scroll-reveal fade/rise animation on section entry (respects `prefers-reduced-motion`), and a clearer publish flow (prominent live URL + copy button once published, confirmation toasts).

**Invitation book — page frames** (`src/components/BookBuilder/frames.ts`, `FrameOverlay.tsx`, `BookViewer.tsx`, `index.tsx`, `src/lib/api.ts`): added an optional per-page `frame` field (3 presets: Sage Hairline, Ivory Double Border, Botanical Corner) rendered as pure CSS/SVG overlays — no raster assets. Backward compatible: pages without a `frame` field render exactly as before.

**Real bug found by the independent QA agent and fixed**: the Sage Hairline and Ivory Double Border frames drew a colored line directly on the photo with no contrast guarantee — against a same-toned photo (sage foliage, ivory dress, or just the app's own cream-toned canvas templates) the border became *completely invisible*. Confirmed via a real screenshot against the sage-colored test fixture image. Fixed by bracketing every colored line with a thin dark ring on one side and a thin light ring on the other (a passe-partout mat effect) so it reads against any background; also added a soft white under-stroke to the Botanical Corner SVG linework for the same reason. Re-verified visually — the bracket is now clearly visible against the exact sage-on-sage case that was previously blank.

**Process note**: three implementation agents were dispatched in parallel with `isolation: "worktree"`, expecting clean isolation — but since none of this session's feature work has ever been committed to git, the worktrees were checked out at a stale commit with none of the actual builder code on disk, and all three agents had to improvise (copying uncommitted state in, or bailing out safely). One agent (canvas templates) correctly refused to depend on another live, uncommitted worktree's code and stopped cleanly rather than guess; it was successfully re-run directly in the main checkout afterward, which is the right way to parallelize agent work in an uncommitted repo like this one. The other two manually copied their finished, verified changes back into the main checkout. All worktrees and their branches were cleaned up afterward (`git worktree remove`, `git branch -D`).

**Verification**: full regression clean after every step — 25/25 Playwright (mocked), 18/18 vitest (5 files, up from 3 — picked up new BookBuilder test coverage along the way), 97/97 pytest, and a clean production build. One real regression was caught and fixed during this pass: the new "Start from a Premade Design" gallery tile shifted the existing template-picker's card indices, breaking `tests/e2e/visual-check.spec.ts`'s hardcoded `.nth(2)` selector — updated to `.nth(3)` with a comment explaining the index.

---

## [2026-06-21] - Customizable Old-System Templates (font/color/position + photo overlay)

**Status**: ✅ COMPLETED (local only, not pushed)

Product owner feedback: the 32 hardcoded `eviteTemplates.ts` designs (the ones actually offered in `/create` today — distinct from the from-scratch Canvas Editor) had zero user-editable styling. Added an override layer on top of each template's existing per-field layout data, without changing any template's default look.

**Database**: new table `evite_customizations` (`backend/migrations/020_create_evite_customizations.sql`, applied live via Supabase MCP) — `event_id` (nullable, FK to `events`, `ON DELETE CASCADE`), `user_id`, `template_id`, `field_overrides` (jsonb), `photo_overlay` (jsonb, nullable), RLS owner-only policy. Confirmed `events` table's 14 columns are unchanged after migration.

**Backend** (`backend/evite_customizations/` — schemas.py, service.py, router.py, registered in `main.py`): `POST /evite-customizations`, `GET /evite-customizations/by-event/{event_id}`, `GET/PATCH/DELETE /evite-customizations/{id}`, ownership-checked via `_assert_owns_event`/`_get_owned` mirroring `event_websites`. 9 new pytest tests (`backend/tests/test_evite_customizations.py`), full suite 106/106 passing.

**Frontend**:
- `src/components/TemplateRenderer.tsx` — added optional `overrides?: Record<string, Partial<TemplateFieldLayout>>` and `photoOverlay?: PhotoOverlay | null` props. Each field's effective style is `{...field, ...overrides?.[field.formKey ?? `field-${idx}`]}` computed just before `fieldStyle()`/`formatFieldValue()` — when both props are absent (every existing call site that wasn't updated, e.g. none — all 3 call sites were updated), rendering is byte-identical to before. Photo overlay renders as an absolutely-positioned `<img>` with `clip-path: circle(50%)` (circle), no clip + `object-fit: cover` (square), or a rounded-top polygon clip-path (arch).
- `src/pages/CreateEvite.tsx` — new "Details / Customize Design" tab pair in the editor modal's right column (only shown when `selectedTemplate.layout` exists). Customize tab: clickable list of the template's text fields (label derived from `formKey` or static text), font dropdown (reusing `FONT_CATEGORIES` from `CanvasEditor/types.ts`), color swatches + raw color input (reusing `COLOR_SWATCHES`), 4-directional nudge buttons (±4px). Separate "Add Your Photo" upload (via `api.uploadMedia`) with circle/square/arch shape picker and its own position/size nudge controls. All state (`fieldOverrides`, `photoOverlay`) feeds the live left-side `<TemplateRenderer>` preview immediately. Reset on template switch (`openTemplate`, `prevTemplate`/`nextTemplate`) so a different design never inherits stale overrides.
- Persistence: `handlePaymentConfirm` calls `api.createEviteCustomization()` right after `api.createEvent()` succeeds (only if overrides/photo exist), non-blocking on failure (same `try/catch`+`console.warn` pattern as the existing invitee save).
- Threaded the same `overrides`/`photoOverlay` through `src/sections/create/PreviewStep.tsx` (the guest-facing preview before payment) and `src/sections/create/FinalPreview.tsx` (last-confirmation screen, currently unused/dead in the live flow but updated per spec anyway) via new `templateOverrides`/`templatePhotoOverlay` props.
- `EventPublic.tsx` (the actual public event page) doesn't render the template/evite card at all today — confirmed via grep, nothing to thread overrides into there.

**Verification**: `npx tsc -b` clean, `npx vitest run` 18/18 passing, backend pytest 106/106 passing (97 pre-existing + 9 new), production `npm run build` clean. Confirmed default (no-override) rendering is unchanged by reasoning through `bday-floral`, `wed-multi-event` (including its static `&` field and untouched `eventsList`/`EventsListLayout` path — deliberately out of scope), and `house-gruhapravesam` (prefix/lineHeight/scaled-coordinate template) — none of their formatting-relevant fields (`text`, `format`, `prefix`, `wrapAfterChars`) are ever touched by an override, only `fontFamily`/`color`/`x`/`y`.

**Known scope boundary**: `EventsListLayout` (multi-event sub-event boxes) intentionally not made customizable, per explicit instruction. The Canvas Editor and its premade templates are untouched, also per instruction.
