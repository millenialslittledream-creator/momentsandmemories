-- Migration 013: Create event_messages table for organiser<->guest messaging

CREATE TABLE IF NOT EXISTS public.event_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('organiser', 'guest')),
    sender_name TEXT,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.event_messages ENABLE ROW LEVEL SECURITY;

-- Organisers can read/write messages for their own events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'event_messages' AND policyname = 'Organiser manages messages'
  ) THEN
    CREATE POLICY "Organiser manages messages"
      ON public.event_messages FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.id = event_id AND e.user_id::text = auth.uid()::text
        )
      );
  END IF;
END $$;

-- Guests can send messages (insert only, no auth)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'event_messages' AND policyname = 'Guests can send messages'
  ) THEN
    CREATE POLICY "Guests can send messages"
      ON public.event_messages FOR INSERT
      WITH CHECK (sender_type = 'guest');
  END IF;
END $$;

-- Anyone can read event messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'event_messages' AND policyname = 'Public can read event messages'
  ) THEN
    CREATE POLICY "Public can read event messages"
      ON public.event_messages FOR SELECT
      USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_event_messages_event_id ON public.event_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_event_messages_created_at ON public.event_messages(created_at DESC);
