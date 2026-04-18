CREATE TABLE IF NOT EXISTS public.logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('debug', 'info', 'warning', 'error')),
    module TEXT NOT NULL,
    action TEXT NOT NULL,
    user_id UUID,
    request_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.logs DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS logs_module_action_idx ON public.logs(module, action);
CREATE INDEX IF NOT EXISTS logs_created_at_idx ON public.logs(created_at DESC);
