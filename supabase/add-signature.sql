-- Add signature_url column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS signature_url TEXT;

-- Create signatures storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to signatures bucket
CREATE POLICY "Authenticated users can upload signatures"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'signatures');

CREATE POLICY "Signatures are publicly readable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'signatures');

CREATE POLICY "Authenticated users can update signatures"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'signatures');
