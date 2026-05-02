-- ============================================================
-- Public protocol submission setup
-- Run this in Supabase SQL Editor (requires service role)
-- ============================================================

-- 1. Allow anonymous users to INSERT into protocols
--    (no auth required — public submission form)
create policy "Public can submit protocols"
  on protocols
  for insert
  to anon
  with check (true);

-- 2. Create storage bucket for protocol file uploads
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'protocol-submissions',
  'protocol-submissions',
  false,
  10485760,  -- 10 MB
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-rar-compressed',
    'image/gif',
    'image/jpeg',
    'image/png'
  ]
)
on conflict (id) do nothing;

-- 3. Allow anonymous users to upload files to the bucket
create policy "Public can upload protocol files"
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'protocol-submissions');

-- 4. Allow authenticated users (reviewers/executives) to read uploaded files
create policy "Authenticated users can read protocol files"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'protocol-submissions');
