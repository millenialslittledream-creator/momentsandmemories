# Staging environment setup

Goal: a full copy of the app that is safe to break, load-test and run `e2e-test-checklist.md` on,
**without touching production data, users, SMS/email providers or billing.**

> Status: steps below were written from the live project's real configuration (schema drift, buckets,
> Realtime publication, env var names) but the staging project itself has **not been created or run yet**.
> Do them in order and tick each one off. Never point staging at production keys.

## 0. What it costs and what it needs
| Item | Notes |
|------|-------|
| New Supabase project | Your org already has 2 projects, which is the free limit, so a third needs a paid plan (about $10/month, billed while it exists) or pausing/removing an unused project. **Do not delete `pharrmasy` or this project to make room.** Delete the staging project when you finish. |
| New Vercel project | Free on Hobby. Created from the CLI and **not connected to Git**, so it never creates branches or deploys on its own. |
| Upstash Redis (optional but recommended) | Free tier is enough. One database for staging, one for production. |
| Tools on your PC | Node 20+, Vercel CLI (`npx vercel`), PostgreSQL client tools (`pg_dump`, `psql`) |

## 1. Supabase staging project
1. Supabase dashboard → **New project** → name `momentsandmemories-staging`, pick the same region as production (`ap-south-1`). Save the database password in your password manager.
2. From Project Settings, copy: **Project URL**, **anon key**, **service_role key**, **database connection string**. Staging keys only ever go into the staging Vercel project.

### Copy the schema (not the data)
Do **not** replay `backend/migrations/001..024`. Production has drifted from them (for example migration 001 points `events.user_id` at `public.users`, but the live database points it at `auth.users`), so a replay builds the wrong schema. Dump the live schema instead:

```bash
# production connection string from Supabase -> Project Settings -> Database (read-only use)
pg_dump --schema-only --no-owner --no-privileges --schema=public \
  --exclude-table=public.campaigns --exclude-table=public.products \
  --exclude-table=public.cost_logs --exclude-table=public.scan_logs \
  --exclude-table=public.user_scans --exclude-table=public.user_scan_items \
  "<PRODUCTION_CONNECTION_STRING>" > staging-schema.sql

psql "<STAGING_CONNECTION_STRING>" -f staging-schema.sql
psql "<STAGING_CONNECTION_STRING>" -f backend/migrations/024_security_hardening.sql
```
(The six excluded tables belong to the other app that shares the production project.)
`--no-privileges` drops grants, so running migration 024 afterwards is what locks `anon` out. Re-run the checks in step 6 to prove it.

### Storage buckets (SQL editor on staging)
```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
 ('user-uploads', 'user-uploads', true, 52428800,
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime']),
 ('template-assets', 'template-assets', true, null, null)
on conflict (id) do nothing;
```
Template images can be reused read-only from production: set `VITE_TEMPLATE_ASSET_BASE_URL` in staging to the same value production uses.

### Realtime
Production only publishes `qr_contact_sessions`. Match it:
```sql
alter publication supabase_realtime add table public.qr_contact_sessions;
```
(Live RSVP analytics use polling in production too, because `event_invitees` is not in the publication.)

### Seed data
Create a few `shop_items` rows by hand (name, price, stock, `is_active = true`). Do **not** copy production users, guests or orders.

### Auth settings (Authentication menu)
- **URL Configuration**: Site URL = the staging URL from step 2; add it under Redirect URLs.
- **Providers → Email**: enabled. Turn **Confirm email** off on staging if you want to skip inbox steps (keep it on to test the full flow).
- **Providers → Google**: enable, paste the same Google OAuth Client ID/secret as production and add the Client ID under authorised client IDs (needed for the Google popup sign-in).
- Optional: enable leaked-password protection.

## 2. Staging Vercel project (no Git connection)
Use a **separate copy of the repo** so the `.vercel` link of your real project is not overwritten:
```bash
git clone <your repo> momentsandmemories-staging && cd momentsandmemories-staging
npx vercel project add momentsandmemories-staging
npx vercel link --project momentsandmemories-staging --yes
```
Add every variable below to the **Production** environment of this staging project (it is its own project, so "Production" here is still staging):
`npx vercel env add NAME production` (the CLI asks for the value, so it is not left in your shell history).

| Variable | Value |
|----------|-------|
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | staging project |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | staging project |
| `JWT_SECRET` | any random string |
| `ADMIN_SECRET` | a **different** long random secret from production |
| `FRONTEND_URL`, `BACKEND_URL` | the staging URL, `https://momentsandmemories-staging.vercel.app` |
| `VITE_API_URL` | `/api` |
| `VITE_GOOGLE_CLIENT_ID` | same public client ID as production |
| `VITE_TEMPLATE_ASSET_BASE_URL` | same as production |
| `RATE_LIMITS_ENABLED` | `false` only while load testing; otherwise leave unset |
| **Leave unset** | `TELNYX_*`, `SENDGRID_API_KEY`, `AWS_*`, `SES_FROM_EMAIL`: staging must not send real SMS or email |

Deploy:
```bash
npx vercel deploy --prod
```
This deploys by upload, so no Git branch or pull request is involved. Then:
1. Google Cloud → your OAuth client → add `https://momentsandmemories-staging.vercel.app` to **Authorized JavaScript origins** (no trailing slash) and add the staging Supabase callback `https://<staging-ref>.supabase.co/auth/v1/callback` to **Authorized redirect URIs**.
2. Open the staging URL, sign up Alice and Bob (see the checklist).

New Vercel projects have Deployment Protection on. Leave it on for previews; staging's main URL is public, so do not share it.

## 3. Shared rate limit (Redis), for staging and production
The app's rate limits are per server instance unless a shared store is configured. Vercel runs many instances, so configure one:
1. Vercel dashboard → the project → **Storage → Marketplace → Upstash (Redis)** → create a database in the region closest to your functions. This injects `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically (the code accepts those or `UPSTASH_REDIS_REST_URL/TOKEN`).
2. Redeploy (`npx vercel deploy --prod` for staging; for production, redeploy from the dashboard or push to `main`).
3. Verify: hit a limited endpoint repeatedly (for example 11 guest messages in a minute) and confirm `429` + `Retry-After`; in the Upstash console you should see keys named `rl:…`.
4. If Redis is down the app keeps working with per-instance limits (it logs a warning); it never blocks users because of Redis.

Do the same for production with its **own** Redis database.

## 4. Vercel Firewall backstop
Production already has `api-rate-limit-backstop` (600 requests/min/IP on `/api`, published with the CLI). Mirror it on staging, but expect load tests from one IP to trip it. Disable it for the test window and re-enable after:
```bash
npx vercel firewall rules add "api-rate-limit-backstop" --action rate_limit \
  --condition '{"type":"path","op":"pre","value":"/api"}' \
  --rate-limit-requests 600 --rate-limit-window 60 --rate-limit-keys ip --rate-limit-action deny --yes
npx vercel firewall publish --yes
```

## 5. Load-test plan (run only against staging)
Rules:
- Never run it against production or the production Supabase project: it shares data and quotas with real users and your other app.
- Use fake data only. Keep `TELNYX_*`, SendGrid and SES unset on staging.
- Set `RATE_LIMITS_ENABLED=false` and disable the firewall rule for the test window. Turn both back on afterwards.
- Start small and ramp up. Stop at once if error rate passes ~5%, p95 latency passes ~3 s, or the Supabase dashboard shows connections or CPU pinned.
- Watch Supabase (Reports: CPU, memory, connections) and Vercel (Observability: function duration, errors, invocations) during the run. Hobby plans have invocation and bandwidth limits, so keep runs short.

What to measure, in priority order:
| Scenario | Why it matters | Healthy target |
|----------|----------------|----------------|
| Public event page `GET /api/public/events/<id>` | Every guest hits it when invitations go out | p95 < 800 ms |
| RSVP submit `POST …/rsvp/<invitee>` | Spike right after invitations are sent | p95 < 1 s, 0 errors |
| Signed-in dashboard calls (`/api/events`, rsvp summary) | Hosts refreshing during an event | p95 < 1 s |
| Guest photo upload (200 KB image) | Biggest payloads; Vercel body limit is 4.5 MB | no 5xx under 4.5 MB |
| Mixed: 90% reads / 9% RSVPs / 1% uploads | Realistic invitation-day traffic | stable with no growth in errors over 10 min |

Things to look for: cold-start spikes, Supabase connection exhaustion (the backend opens a new connection per request, see `backend/database.py`), 5xx under bursts, and whether a single noisy IP or user can degrade others.

## 6. Verify staging is locked down
Using only the staging **anon key**, each of these must be denied or empty:
```bash
curl -s "<STAGING_URL>/rest/v1/users?select=*"           -H "apikey: <ANON>" -H "Authorization: Bearer <ANON>"
curl -s "<STAGING_URL>/rest/v1/event_invitees?select=*"   -H "apikey: <ANON>" -H "Authorization: Bearer <ANON>"
curl -s "<STAGING_URL>/rest/v1/logs?select=*"             -H "apikey: <ANON>" -H "Authorization: Bearer <ANON>"
curl -s -X POST "<STAGING_URL>/rest/v1/rpc/sum_revenue"   -H "apikey: <ANON>" -H "Authorization: Bearer <ANON>"
```
Expect a permission error or `[]`, never rows. Then run the Supabase "Security advisor" and fix anything flagged.

## 7. Clean up
Delete the staging Vercel project, the staging Redis database and the staging Supabase project when finished, so nothing keeps billing.
