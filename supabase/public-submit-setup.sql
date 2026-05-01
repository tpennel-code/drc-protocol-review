-- ============================================================
-- Run this in the Supabase SQL editor
-- Enables public protocol submission (no login required)
-- ============================================================

-- 1. Allow anonymous users to insert protocols
CREATE POLICY "Public protocol submissions"
  ON public.protocols FOR INSERT WITH CHECK (true);

-- 2. Create storage bucket for submitted files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'protocol-submissions',
  'protocol-submissions',
  false,
  10485760,  -- 10 MB
  ARRAY[
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/gif','image/jpeg','image/png',
    'application/zip','application/x-rar-compressed'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 3. Allow anyone to upload files (public submission form)
CREATE POLICY "Anyone can upload protocol files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'protocol-submissions');

-- 4. Allow authenticated users (reviewers/executives) to read submitted files
CREATE POLICY "Authenticated users can read protocol files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'protocol-submissions' AND auth.role() = 'authenticated');
