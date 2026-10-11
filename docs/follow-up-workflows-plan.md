# Plan — Follow-up Workflows (Item #13)

**Date:** 2026-08-17
**Status:** Plan for review. Nothing implemented yet.
**Scope:** Post-invitation and post-event automation:
1. Create & share a digital **photo book** after the event.
2. Send a **thank-you** message with a link to event photos.
3. **Configurable reminder rules** to auto-resend invitations to non-responders.
4. **Pre-event reminders** to guests (RSVP'd and/or not-yet-responded), per the rules.

---

## Current state (grounded in the code)

- **Invitees + RSVP** exist: `event_invitees` table, RSVP pages (`/rsvp/:eventId/:inviteeId`), and RSVP stats on the dashboard (`api.getEventRSVPStats`).
- **Sending** exists: `backend/notifications/service.py` — `send_notification` (single) and `bulk_send` / `_do_bulk_send` (bulk) via **Amazon SES** (email) and **Telnyx** (SMS, REST via httpx). WhatsApp is a deep link.
- **Photo capture** exists: guests upload via `/gallery/:eventId` (`GuestGalleryUpload`), and `api.getPublicBook` returns book pages. Public event page is `/event/:eventId`.
- **No scheduler** anywhere in `backend/` — all sends are on-demand (request-triggered). This is the main new capability the reminder features need.
- **No reminder-rules table**, no "thank-you" flow, no photo-book share/send flow.

---

## Decisions needed before building

1. **Scheduler infra** for time-based reminders (the only truly new infrastructure):
   - **(A) Supabase pg_cron + a backend endpoint** — a DB cron calls a secured internal endpoint (e.g. `POST /internal/run-reminders`) every N minutes. No new service. **Recommended.**
   - **(B) External cron** (GitLab CI schedule / cloud scheduler) hitting the same endpoint.
   - **(C) In-process APScheduler** in FastAPI — simplest to code, but breaks with multiple workers / restarts. Not recommended for production.
2. **Photo-book privacy** — public link (simple) vs. signed/tokenized link (matches the existing `upload_token` pattern). Recommend a per-event **share token**.
3. **Auto-resend guardrails** — max resends per guest, min gap between messages, quiet hours. Needs sensible defaults (below).
4. **Channel for reminders** — reuse the event's original delivery preference (email / SMS / both), or let the host choose per reminder.

---

## Phase A — Host-triggered actions (no scheduler; ship first)

These deliver value immediately and need **no** new infra — they reuse `bulk_send`.

### A1. "Resend to non-responders" (manual)
- **Backend:** `POST /events/{event_id}/remind` (auth, host) — body `{ channel, only_no_response: true }`. Selects `event_invitees` where `rsvp_status IS NULL`, calls `bulk_send` with the invite link.
- **Frontend:** button on the Dashboard event card / RSVP panel: "Nudge non-responders (N)".

### A2. Thank-you message + photo link (manual)
- **DB:** add `events.share_token` (text, unique) generated at publish; `event_photos` already exists per the photo-book plan (or reuse the album/book table).
- **Backend:** `POST /events/{event_id}/thank-you` (auth, host) — body `{ channel, message? }`. Sends the thank-you text + `/{book|gallery}/{share_token}` link to all invitees (optionally only `rsvp_status = 'accepted'`).
- **Frontend:** "Send thank-you" action on the Dashboard, available once the event date has passed. Live message preview (reuse the share-message pattern from the evite share step).

### A3. Photo-book viewer + share
- **Frontend:** public route `/book/:token` (or reuse `/event/:eventId` with a Photos tab) rendering `getPublicBook` pages with an existing gallery component (`3d-gallery-photography.tsx` / `circular-gallery.tsx`).
- **Backend:** `GET /public/book/{token}` (public) — already close to `getPublicBook`; add token resolution.

---

## Phase B — Reminder rules + scheduler (automated)

### B1. Data model
- **Migration** `xxx_create_reminder_rules.sql`:
  - `reminder_rules(id, event_id FK, kind['pre_event'|'no_response_resend'], enabled bool, offset_days int, offset_direction['before'|'after'], audience['all'|'no_response'|'accepted'], channel['email'|'sms'|'both'], max_sends int default 1, created_at)`
  - `reminder_sends(id, rule_id FK, invitee_id FK, sent_at, status)` — idempotency ledger so a guest is never double-sent for the same rule/day.

### B2. Scheduler + runner (decision A above)
- **Endpoint:** `POST /internal/run-reminders` (secured by a shared secret header, **not** user auth). Idempotent; safe to call every 5–15 min.
- **Logic per due rule:**
  1. Compute target date window from `event.event_date` + `offset_days`/direction.
  2. Select invitees by `audience` (e.g. `no_response` → `rsvp_status IS NULL`).
  3. Exclude anyone already in `reminder_sends` for this rule within the window / over `max_sends`.
  4. `bulk_send` on the rule's channel; record `reminder_sends` rows.
- **Guardrails/defaults:** max 2 resends per guest per event; ≥ 24 h gap; skip if event already passed (for pre-event) ; quiet-hours optional later.

### B3. Frontend — rule configuration
- Dashboard → per-event "Reminders" panel: toggle pre-event reminder (e.g. "3 days before") and auto-resend ("every 3 days to non-responders, max 2"), pick channel. Persists to `reminder_rules`.

---

## Suggested sequencing

1. **A1** (resend non-responders) — smallest, immediately useful, no schema.
2. **A2 + A3** (thank-you + photo-book share/viewer) — needs `share_token` + public book route.
3. **B1 → B2 → B3** (rules + scheduler) — the automated layer, once A proves the send paths.

## Rough effort (relative)

| Item | Effort |
|------|--------|
| A1 resend | S |
| A2 thank-you | S–M |
| A3 book viewer/share | M (gallery components exist) |
| B1 schema | S |
| B2 scheduler+runner | M (plus infra decision) |
| B3 rules UI | M |

## Open questions for the team

- Which scheduler option (A/B/C)? Recommend **A (pg_cron → internal endpoint)**.
- Default reminder cadence & caps acceptable? (2 resends, 24 h gap, "3 days before".)
- Photo-book link: public vs. tokenized? Recommend **tokenized share link**.
- Thank-you audience: all invitees vs. only attendees (`accepted`)?
