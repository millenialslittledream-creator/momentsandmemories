-- Performance indexes for production scalability

CREATE INDEX IF NOT EXISTS idx_events_user_id ON events (user_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_invitees_event_id ON event_invitees (event_id);

CREATE INDEX IF NOT EXISTS idx_event_drafts_user_id ON event_drafts (user_id);

CREATE INDEX IF NOT EXISTS idx_qr_sessions_expires_at ON qr_contact_sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_qr_sessions_user_id ON qr_contact_sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs (user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs (created_at DESC);
