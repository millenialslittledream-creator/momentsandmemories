# Database Migrations

Run these SQL files in order in Supabase Dashboard → SQL Editor.

| File | Creates |
|------|---------|
| 001_create_events.sql | events table |
| 002_create_event_invitees.sql | event_invitees table |
| 003_create_qr_contact_sessions.sql | qr_contact_sessions table |
| 004_create_shop_items.sql | shop_items table |
| 005_create_orders.sql | orders table |
| 006_create_order_items.sql | order_items table |
| 007_create_notifications_table.sql | notifications table |
| 008_create_logs.sql | logs table + indexes |
| 009_analytics_functions.sql | PostgreSQL helper functions for analytics |
| 010_create_event_drafts.sql | event_drafts table |
| 011_performance_indexes.sql | performance indexes |
| 012_rsvp_and_public.sql | RSVP + public event fields |
| 013_event_messages.sql | event_messages table |
| 014_create_media_uploads.sql | media_uploads table (canvas editor — uploaded images/video) |
| 015_create_user_templates.sql | user_templates table (canvas editor — saved custom designs) |
| 016_create_user_uploads_bucket.sql | `user-uploads` Storage bucket + owner-scoped policies |

**Note:** The `users` table already exists — do NOT run any migration that recreates it.
Run files in numbered order as later ones reference earlier tables via foreign keys.
