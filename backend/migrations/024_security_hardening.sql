-- Migration 024: security hardening (found by audit, verified against the live project)
--
-- Context: the browser ships the Supabase ANON key. Anything the `anon` / `authenticated`
-- roles can reach through PostgREST (/rest/v1/...) is reachable by anybody on the internet.
-- This app's frontend never queries tables directly (auth only) and the FastAPI backend uses
-- the service_role key (which bypasses RLS), so all table access for `anon`/`authenticated`
-- on THIS app's tables can be removed without changing app behaviour.
--
-- NOT touched on purpose: campaigns, products, cost_logs, scan_logs, user_scans, user_scan_items
-- and the `booklets` storage bucket. They belong to a different app sharing this project and
-- rely on anon policies. They are flagged in the audit report instead.
--
-- Rollback for any section = re-GRANT / re-CREATE POLICY. No data is modified or deleted.

BEGIN;

-- 1. Tables with RLS OFF (publicly readable/writable via the anon key today) ------------------
--    public.users holds password_hash, otp_code, reset_token, google_id.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs  ENABLE ROW LEVEL SECURITY;

-- 2. Remove the "USING (true)" policies that expose every guest / message / QR session --------
DROP POLICY IF EXISTS "Invitees can update own rsvp"                ON public.event_invitees;
DROP POLICY IF EXISTS "Public can read invitee count"               ON public.event_invitees;
DROP POLICY IF EXISTS "Public can read event messages"              ON public.event_messages;
DROP POLICY IF EXISTS "Guests can send messages"                    ON public.event_messages;
DROP POLICY IF EXISTS "Anyone can read pending sessions by token"   ON public.qr_contact_sessions;
-- Storage: this SELECT policy lets anyone LIST every file in the bucket (incl. unapproved
-- gallery photos). Public buckets serve files by URL without it.
DROP POLICY IF EXISTS "Public can read user-uploads"                ON storage.objects;

-- 3. Defence in depth: no direct table privileges for the public API roles ---------------------
REVOKE ALL ON
    public.users, public.logs, public.events, public.event_invitees, public.event_messages,
    public.qr_contact_sessions, public.notifications, public.orders, public.order_items,
    public.shop_items, public.event_drafts, public.media_uploads, public.user_templates,
    public.premium_websites, public.event_websites, public.invitation_books,
    public.event_gallery_photos, public.evite_customizations
FROM anon, authenticated;

-- 3b. Supabase Realtime (Dashboard live RSVPs, QR contact import) subscribes as the signed-in
--     user, so it needs SELECT on exactly these two tables. RLS still limits rows to the owner.
GRANT SELECT ON public.event_invitees, public.qr_contact_sessions TO authenticated;

-- 4. SECURITY DEFINER helper functions must not be callable through /rest/v1/rpc ----------------
REVOKE EXECUTE ON FUNCTION public.sum_revenue()                  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.user_growth_by_day(integer)    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.order_stats_by_day(integer)    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable()              FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.sum_revenue()               SET search_path = public, pg_temp;
ALTER FUNCTION public.user_growth_by_day(integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.order_stats_by_day(integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_event_drafts_updated_at() SET search_path = public, pg_temp;

-- 5. Bucket limits: user-uploads accepted ANY file type/size (incl. scripted SVG) --------------
UPDATE storage.buckets
SET file_size_limit    = 52428800,  -- 50 MB (matches backend video cap)
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime']
WHERE id = 'user-uploads';

COMMIT;
