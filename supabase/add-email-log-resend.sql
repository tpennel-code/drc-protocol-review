-- ============================================================
-- Track outcome-email sends against protocols so the chair can
-- see, per protocol, that the approval/outcome email went out —
-- and verify with Resend that it was actually delivered.
--
-- The email_logs table already exists (see schema.sql); this adds
-- the Resend linkage and last-known delivery status.
-- ============================================================

ALTER TABLE public.email_logs
  ADD COLUMN IF NOT EXISTS resend_message_id  TEXT,
  ADD COLUMN IF NOT EXISTS subject             TEXT,
  ADD COLUMN IF NOT EXISTS delivery_status     TEXT,        -- Resend last_event: sent|delivered|bounced|...
  ADD COLUMN IF NOT EXISTS delivery_checked_at TIMESTAMPTZ; -- when we last polled Resend for status

-- Idempotent backfill: never log the same Resend message twice.
CREATE UNIQUE INDEX IF NOT EXISTS email_logs_resend_message_id_key
  ON public.email_logs (resend_message_id)
  WHERE resend_message_id IS NOT NULL;

-- The pill query filters by protocol; index it.
CREATE INDEX IF NOT EXISTS email_logs_protocol_id_idx
  ON public.email_logs (protocol_id);
