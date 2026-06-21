-- New table only. Does not modify any existing table.
CREATE TABLE IF NOT EXISTS public.media_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('image', 'video')),
    mime_type TEXT,
    file_size_bytes INT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.media_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their own uploads"
    ON public.media_uploads FOR ALL
    USING (auth.uid() = user_id);
