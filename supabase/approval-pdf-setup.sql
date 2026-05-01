-- ============================================================
-- Approval PDF setup
-- Run in Supabase SQL editor
-- ============================================================

-- Chair flag: the profile marked is_chair = true signs all approval letters
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_chair BOOLEAN DEFAULT false;

-- Signature image path in Supabase Storage (profile-signatures bucket)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signature_url TEXT;

-- Approval timestamp (already referenced in OutcomePanel — add if missing)
ALTER TABLE public.protocols ADD COLUMN IF NOT EXISTS approval_date TIMESTAMPTZ;

-- ── Storage bucket for signature images ──────────────────────

INSERT INTO storage.buckets (id, name, public)
  VALUES ('profile-signatures', 'profile-signatures', false)
  ON CONFLICT DO NOTHING;

-- Users can upload into their own folder (path: {user_id}/signature.png)
CREATE POLICY IF NOT EXISTS "Users upload own signature"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-signatures'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow replace (update) of own signature
CREATE POLICY IF NOT EXISTS "Users update own signature"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile-signatures'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can read any signature (needed for PDF generation)
CREATE POLICY IF NOT EXISTS "Authenticated read signatures"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'profile-signatures');

-- ── Set the chair ─────────────────────────────────────────────
-- Run this after confirming Dr Warden's email in profiles:
-- UPDATE public.profiles SET is_chair = true WHERE email = 'claire.warden@uct.ac.za';
