CREATE TABLE IF NOT EXISTS public.event_invitees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    phone TEXT,
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'qr_import', 'csv')),
    rsvp_status TEXT DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'accepted', 'declined')),
    invited_at TIMESTAMPTZ DEFAULT now(),
    responded_at TIMESTAMPTZ
);

ALTER TABLE public.event_invitees ENABLE ROW LEVEL SECURITY;
