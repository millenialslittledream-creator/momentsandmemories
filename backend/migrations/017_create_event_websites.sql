-- Feature 2: Event/Wedding Website Builder
-- New table only — does not modify the existing `events` table.
-- Ownership is enforced in application code by checking events.user_id (read-only join),
-- exactly like backend/events/service.py:get_rsvp_stats already does for event_invitees.

CREATE TABLE IF NOT EXISTS public.event_websites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    sections JSONB NOT NULL DEFAULT '[]'::jsonb,
    theme JSONB NOT NULL DEFAULT '{}'::jsonb,
    published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_websites_event_id ON public.event_websites(event_id);
CREATE INDEX IF NOT EXISTS idx_event_websites_slug ON public.event_websites(slug);

ALTER TABLE public.event_websites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their own event websites"
    ON public.event_websites FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Public can read published event websites"
    ON public.event_websites FOR SELECT
    USING (published = true);
