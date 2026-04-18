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

**Note:** The `users` table already exists — do NOT run any migration that recreates it.
Run files in numbered order as later ones reference earlier tables via foreign keys.
