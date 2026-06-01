-- Migration 012: Add RSVP fields, public slugs to events and invitees

-- Add public sharing + RSVP columns to events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS rsvp_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE;

-- Generate slugs for existing events
UPDATE public.events
SET public_slug = LOWER(REGEXP_REPLACE(title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTRING(id::text, 1, 6)
WHERE public_slug IS NULL;

-- Add RSVP message + dietary fields to invitees
ALTER TABLE public.event_invitees
  ADD COLUMN IF NOT EXISTS rsvp_message TEXT,
  ADD COLUMN IF NOT EXISTS dietary_requirements TEXT;

-- Allow public read of published events (for public event page, no auth required)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Public can view published events'
  ) THEN
    CREATE POLICY "Public can view published events"
      ON public.events FOR SELECT
      USING (status = 'published');
  END IF;
END $$;

-- Allow unauthenticated RSVP updates on invitee rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'event_invitees' AND policyname = 'Invitees can update own rsvp'
  ) THEN
    CREATE POLICY "Invitees can update own rsvp"
      ON public.event_invitees FOR UPDATE
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'event_invitees' AND policyname = 'Public can read invitee count'
  ) THEN
    CREATE POLICY "Public can read invitee count"
      ON public.event_invitees FOR SELECT
      USING (true);
  END IF;
END $$;
