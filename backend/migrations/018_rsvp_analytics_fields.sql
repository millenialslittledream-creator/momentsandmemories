-- Migration 018: RSVP analytics fields on invitees
-- Additive only — all columns are nullable so existing rows/behaviour are unaffected.

ALTER TABLE public.event_invitees
  ADD COLUMN IF NOT EXISTS party_size INTEGER,
  ADD COLUMN IF NOT EXISTS kids_count INTEGER,
  ADD COLUMN IF NOT EXISTS food_preference TEXT;

-- Allow a "maybe" (tentative) RSVP in addition to accepted/declined/pending.
ALTER TABLE public.event_invitees DROP CONSTRAINT IF EXISTS event_invitees_rsvp_status_check;
ALTER TABLE public.event_invitees
  ADD CONSTRAINT event_invitees_rsvp_status_check
  CHECK (rsvp_status IN ('pending', 'accepted', 'declined', 'maybe'));
