-- Feature 4: Guest photo gallery -> auto-collage album
-- New table only — does not modify the existing `events` table.
-- Deliberately self-contained (storage_path/public_url/mime_type columns of its own) rather than
-- referencing media_uploads, because media_uploads.user_id is NOT NULL (owner-scoped) and guests
-- contributing photos have no account — uploads happen through the backend's service-role client,
-- which bypasses Storage/Table RLS entirely, so no anonymous write policy is needed below.

CREATE TABLE IF NOT EXISTS public.event_gallery_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    mime_type TEXT,
    file_size_bytes INT,
    uploaded_by_name TEXT,
    approved BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_gallery_photos_event_id ON public.event_gallery_photos(event_id);

ALTER TABLE public.event_gallery_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event owners can manage their gallery photos"
    ON public.event_gallery_photos FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = event_gallery_photos.event_id
            AND events.user_id = auth.uid()
        )
    );

CREATE POLICY "Public can read approved photos for published events"
    ON public.event_gallery_photos FOR SELECT
    USING (
        approved = true
        AND EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = event_gallery_photos.event_id
            AND events.status = 'published'
        )
    );
