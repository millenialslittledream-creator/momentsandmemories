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
