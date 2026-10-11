# Security audit — October 2026

Scope: FastAPI backend, React frontend, Supabase project `xtjzxynspkdhaeljnimp` (live), CI/deploy config.
Method: code review of every route + service, 29 exploit proof-of-concepts against the real backend code on an
in-memory database (never the live project), live Supabase policy/grant inspection (read-only), dependency audits.
Every exploit is now a regression test: `backend/tests/test_security_regressions.py`.

## Fixed in this change

| ID | Finding | Fix |
|----|---------|-----|
| DB-1 | `public.users` (password_hash, otp_code, reset_token) and `public.logs` had **RLS off**; `anon` held full read/write | RLS on, all grants revoked (migration 024, **applied live**) |
| DB-2 | `USING (true)` policies exposed every guest, message and pending QR session to the public anon key | Policies dropped (applied live); Realtime keeps owner-scoped `SELECT` for `authenticated` |
| DB-3 | SECURITY DEFINER functions (revenue, signups, `rls_auto_enable`) callable via `/rest/v1/rpc` | `EXECUTE` revoked, `search_path` pinned |
| DB-4 | `user-uploads` bucket: any file type/size, listable by anyone | 50 MB + image/video allow-list; list policy dropped |
| F-01 | Any logged-in user could read/add/delete **any event's guest list** | Ownership check on all invitee routes |
| F-02 | Messaging IDOR + organiser impersonation; unauthenticated guest messages unvalidated | Ownership check; guest must be a real invitee of a published event; size + rate limits |
| F-03 | `/notifications/*` = SMS/email relay (arbitrary recipients, 2000 sends/request, HTML email from our domain) | Ownership on `event_id`, 200-recipient cap, per-user rate limits, E.164 + country allow-list for SMS (`SMS_ALLOWED_PREFIXES`), emails HTML-escaped, caller id taken from the token |
| F-04 | Shop: negative quantities (negative totals, stock inflation), duplicate-line oversell, failed orders left stock decremented | `quantity` 1–100, merged lines, compare-and-swap stock reservation with rollback |
| F-05 | Empty/unset `ADMIN_SECRET` accepted an empty header; no brute-force protection; non-constant-time compare | Admin disabled when unset (503), `hmac.compare_digest`, 10 failures / 10 min lockout |
| F-06 | Legacy `/auth/*` returned OTPs and reset tokens in the response (account takeover) | Module removed (frontend uses Supabase Auth only) |
| F-07 | Event `PATCH` accepted any `status` | Validated |
| F-08 | Anonymous gallery / media uploads: scripted SVG, client-controlled type and file name, no limits | Type from magic bytes (JPEG/PNG/GIF/WebP, MP4/MOV), server-generated names, size caps, per-IP rate limit, 300 photos/event |
| F-09 | QR session readable by any user; `event_id` unchecked | Owner-only, no `user_id` in response |
| F-10 | `/docs` public, no security headers, CORS trusted any `localhost:<port>` in prod, no rate limits | Docs off by default (`ENABLE_API_DOCS`), headers middleware, CORS tightened (`ALLOW_LOCALHOST_CORS`), rate limits on public/auth'd write endpoints |
| F-11 | Guest emails/phones written to the logs table; unbounded log thread per request | PII removed from log metadata; bounded log workers |
| DEP | npm: 29 advisories (21 high). Python: starlette ×14, python-multipart ×14, jinja2 ×6, python-jose ×5, … | Python: **0 known**. npm: 7 left (all Tailwind v3 build tooling, not shipped) |
| UX | Google page said "to continue to xtjzxynspkdhaeljnimp.supabase.co" | Google Identity Services button (`GoogleAuthButton`), needs `VITE_GOOGLE_CLIENT_ID` |
| FE | `kimi-plugin-inspect-react` ran in production builds; no browser security headers | Dev-server only; headers + CSP (report-only) in `vercel.json` |

## Still open — needs you (not code)

1. **Google sign-in popup**: set `VITE_GOOGLE_CLIENT_ID`, add site origins under Google Cloud → Credentials → Authorized JavaScript origins.
2. **Production env**: `ADMIN_SECRET` must be a long random value (admin API is now *off* if empty); set `TELNYX_*`; remove `ALLOW_LOCALHOST_CORS`/`ENABLE_API_DOCS` if ever set.
3. **Rotate the GitLab token** embedded in the `gitlab` git remote URL; rotate the Vercel OIDC token/service key in `.env.production` if that file was ever shared.
4. **Supabase dashboard**: enable leaked-password protection (Auth → Providers → Email; may need Pro), set a custom SMTP + rate limits.
5. **Other app sharing this project** (campaigns, products, cost_logs, scan_logs, user_scans, `booklets` bucket): anon can read/write/delete. Move it to its own project or lock it down.
6. **Payments**: the card form collects card details that go nowhere; orders are never charged. Integrate a processor (Stripe Elements) before taking real orders — do not ship a card form that discards data.
7. **Admin moderation**: owners can re-publish an event an admin archived (needs a `moderated` column to distinguish).
8. **nginx/EC2**: add the same security headers + `client_max_body_size 60m` + `limit_req` at the proxy; rate limits in the app are per-process.
9. **Tailwind v3 → v4** migration clears the last 7 npm advisories (build-time only).
10. **Load testing**: not done yet — run after deploy against a staging copy, not the live project.
