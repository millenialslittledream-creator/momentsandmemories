CREATE TABLE IF NOT EXISTS public.qr_contact_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
    contacts_json JSONB DEFAULT '[]'::jsonb,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

ALTER TABLE public.qr_contact_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pending sessions by token"
    ON public.qr_contact_sessions FOR SELECT
    USING (status = 'pending');

CREATE POLICY "Owners can read all their sessions"
    ON public.qr_contact_sessions FOR ALL
    USING (auth.uid()::text = user_id::text);
