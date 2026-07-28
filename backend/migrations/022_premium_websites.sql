-- Migration 022: Premium event-website publishing.
--
-- The premium website editors (wedding / birthday / event) are a design + theme
-- + content bundle rendered by a React component — not the section-builder shape
-- stored in event_websites, and they aren't tied to an `events` row. So they get
-- their own self-contained, per-user table published to /site/<slug>.
CREATE TABLE IF NOT EXISTS public.premium_websites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    event_key TEXT NOT NULL,          -- 'marriage' | 'birthday' | <EventKey>
    design_id TEXT NOT NULL,
    theme_id TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_premium_websites_slug ON public.premium_websites(slug);
CREATE INDEX IF NOT EXISTS idx_premium_websites_user_id ON public.premium_websites(user_id);

ALTER TABLE public.premium_websites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their own premium websites"
    ON public.premium_websites FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Public can read published premium websites"
    ON public.premium_websites FOR SELECT
    USING (published = true);
