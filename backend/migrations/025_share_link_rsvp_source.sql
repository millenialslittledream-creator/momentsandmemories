-- Migration 025: identify guests who RSVP directly from a public share link.

ALTER TABLE public.event_invitees
  DROP CONSTRAINT IF EXISTS event_invitees_source_check;

ALTER TABLE public.event_invitees
  ADD CONSTRAINT event_invitees_source_check
  CHECK (source IN ('manual', 'qr_import', 'csv', 'share_link'));

COMMENT ON COLUMN public.event_invitees.source IS
  'How the guest entered the event: host guest list, import, or the public share link.';
