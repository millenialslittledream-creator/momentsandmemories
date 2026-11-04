-- Migration 026: dedicated storage bucket for images used in premium website designs.
--
-- Problem: the premium editors kept uploaded pictures as browser-only blob: URLs, so published
-- /site/<slug> pages showed broken images to everyone except the author.
-- Fix: images are uploaded through POST /api/premium-websites/images into this bucket and the
-- permanent public URL is what gets saved in the site content.
--
-- Access model:
--   * public = true  -> every visitor of a shared site can load the files by exact URL
--   * NO storage.objects policies are created on purpose:
--       - nobody can LIST the bucket through the public API
--       - nobody can write with the anon/authenticated keys; only the backend (service role) writes
--   * images only, 10 MB each (the backend also verifies the real file type from its bytes)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'premium-site-media',
    'premium-site-media',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
    set public = excluded.public,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;
