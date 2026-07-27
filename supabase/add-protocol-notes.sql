-- Free-text administrative notes on a protocol — e.g. a record of phone calls
-- or emails with the researcher. Independent of the review lifecycle: editable
-- before, during and after the final outcome, and never sent to the applicant
-- or included in the agenda/letters.
ALTER TABLE public.protocols
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.protocols
  ADD COLUMN IF NOT EXISTS notes_updated_at TIMESTAMPTZ;
