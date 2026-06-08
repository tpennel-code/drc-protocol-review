-- Fast-track lifecycle decision, tracked separately from final_outcome.
-- NULL = pending chair decision ("Fast Track Request").
ALTER TABLE public.protocols
  ADD COLUMN IF NOT EXISTS fast_track_decision TEXT
  CHECK (fast_track_decision IN ('accepted','rejected'));

-- Backfill: every existing fast-track request was historically accepted
-- (these rows already carry their formal approval in final_outcome).
UPDATE public.protocols
  SET fast_track_decision = 'accepted'
  WHERE fast_tracked = true AND fast_track_decision IS NULL;
