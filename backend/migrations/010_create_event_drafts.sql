CREATE TABLE IF NOT EXISTS event_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step INTEGER NOT NULL DEFAULT 0,
  event_type TEXT,
  form_data JSONB NOT NULL DEFAULT '{}',
  selected_template TEXT,
  guests JSONB NOT NULL DEFAULT '[]',
  delivery_preference TEXT NOT NULL DEFAULT 'email',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS event_drafts_user_idx ON event_drafts (user_id);

CREATE OR REPLACE FUNCTION update_event_drafts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS event_drafts_updated_at ON event_drafts;
CREATE TRIGGER event_drafts_updated_at
  BEFORE UPDATE ON event_drafts
  FOR EACH ROW EXECUTE FUNCTION update_event_drafts_updated_at();

ALTER TABLE event_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_draft_select" ON event_drafts;
DROP POLICY IF EXISTS "own_draft_insert" ON event_drafts;
DROP POLICY IF EXISTS "own_draft_update" ON event_drafts;
DROP POLICY IF EXISTS "own_draft_delete" ON event_drafts;

CREATE POLICY "own_draft_select" ON event_drafts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_draft_insert" ON event_drafts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_draft_update" ON event_drafts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_draft_delete" ON event_drafts FOR DELETE USING (auth.uid() = user_id);
