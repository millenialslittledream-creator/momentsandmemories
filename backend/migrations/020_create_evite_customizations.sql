-- New table only. Does not modify any existing table (including events) —
-- event_id is nullable because customization happens during the create flow
-- before a real event row exists; it's filled in once the event is created.
CREATE TABLE IF NOT EXISTS public.evite_customizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id TEXT NOT NULL,
    field_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
    photo_overlay JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.evite_customizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their own evite customizations"
    ON public.evite_customizations FOR ALL
    USING (auth.uid() = user_id);
