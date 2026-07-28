-- Migration 021: Store the full evite form data on the event.
--
-- The public evite page re-renders the *designed* invitation (template with the
-- host's names / date / venue / sub-events, plus font/colour/size/position
-- overrides). The events table only keeps title/date/time/location, which isn't
-- enough to reconstruct the artwork, so we stash the whole create-flow formData
-- record here as JSON. Nullable — older events simply have no snapshot.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS form_data JSONB;
