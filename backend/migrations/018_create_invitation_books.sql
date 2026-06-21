-- Feature 3: "Book" with page-turn animation for the invitation
-- New table only — does not modify the existing `events` table.
-- Each page is just {id, image_url} — pages are produced either by uploading an image directly
-- or by flattening a canvas-editor design to a PNG (same client-side export already built for
-- the canvas template editor) and uploading that, so this reuses the existing media_uploads
-- infrastructure rather than building a second upload pipeline.

CREATE TABLE IF NOT EXISTS public.invitation_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    pages JSONB NOT NULL DEFAULT '[]'::jsonb,
    published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitation_books_event_id ON public.invitation_books(event_id);

ALTER TABLE public.invitation_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their own invitation books"
    ON public.invitation_books FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Public can read published invitation books"
    ON public.invitation_books FOR SELECT
    USING (published = true);
