-- New table only. Does not modify any existing table (including events) —
-- the relationship is established by this new table referencing events.id,
-- not by altering the events table.
CREATE TABLE IF NOT EXISTS public.user_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    name TEXT,
    event_type TEXT,
    canvas_width INT NOT NULL,
    canvas_height INT NOT NULL,
    background JSONB NOT NULL DEFAULT '{"type":"color","value":"#ffffff"}'::jsonb,
    elements JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_draft BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their own templates"
    ON public.user_templates FOR ALL
    USING (auth.uid() = user_id);
