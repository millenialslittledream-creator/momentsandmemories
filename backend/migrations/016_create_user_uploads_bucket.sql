-- New Storage bucket only. Does not touch any existing bucket (the project already
-- has an unrelated "booklets" bucket — left untouched).
insert into storage.buckets (id, name, public)
values ('user-uploads', 'user-uploads', true)
on conflict (id) do nothing;

-- Upload path convention: user-uploads/{auth.uid()}/{filename}
-- Owners can only write inside their own folder; anyone can read (uploaded images/video
-- need to be viewable by guests, who are not authenticated).
create policy "Owners can upload to their own folder"
    on storage.objects for insert
    with check (bucket_id = 'user-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Owners can update their own files"
    on storage.objects for update
    using (bucket_id = 'user-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Owners can delete their own files"
    on storage.objects for delete
    using (bucket_id = 'user-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Public can read user-uploads"
    on storage.objects for select
    using (bucket_id = 'user-uploads');
