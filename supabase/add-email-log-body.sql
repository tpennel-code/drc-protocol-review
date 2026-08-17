-- ============================================================
-- The chair now composes outcome emails on screen before they
-- send — editing the body and choosing which reviewer documents
-- to attach — so the subject alone no longer describes what the
-- applicant received.
--
-- Keep the sent body and the attachment filenames against the log
-- row, so there is a durable record of exactly what went out.
-- ============================================================

ALTER TABLE public.email_logs
  ADD COLUMN IF NOT EXISTS body             TEXT,
  ADD COLUMN IF NOT EXISTS attachment_names TEXT[];
