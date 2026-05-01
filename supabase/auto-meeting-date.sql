-- ============================================================
-- Auto-assign meeting date to new protocol submissions
-- Run in Supabase SQL editor AFTER meetings-setup.sql
-- ============================================================

-- Function: find the next submission deadline >= submission date,
-- then assign the paired meeting date (by rank in each table)
CREATE OR REPLACE FUNCTION public.assign_meeting_date_fn()
RETURNS TRIGGER AS $$
DECLARE
  v_submission_date DATE;
  v_deadline_rank   BIGINT;
  v_meeting_date    DATE;
BEGIN
  v_submission_date := COALESCE(NEW.submitted_at::date, CURRENT_DATE);

  -- Rank of the first upcoming deadline on or after the submission date
  SELECT rn INTO v_deadline_rank
  FROM (
    SELECT deadline_date,
           ROW_NUMBER() OVER (ORDER BY deadline_date) AS rn
    FROM public.submission_deadlines
  ) ranked
  WHERE deadline_date >= v_submission_date
  ORDER BY deadline_date
  LIMIT 1;

  IF v_deadline_rank IS NOT NULL THEN
    -- Paired meeting date at the same rank
    SELECT meeting_date INTO v_meeting_date
    FROM (
      SELECT meeting_date,
             ROW_NUMBER() OVER (ORDER BY meeting_date) AS rn
      FROM public.meeting_dates
    ) ranked
    WHERE rn = v_deadline_rank;

    IF v_meeting_date IS NOT NULL THEN
      NEW.meeting_date := v_meeting_date::text;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: fires BEFORE INSERT only when meeting_date is not already set
DROP TRIGGER IF EXISTS auto_assign_meeting_date ON public.protocols;

CREATE TRIGGER auto_assign_meeting_date
  BEFORE INSERT ON public.protocols
  FOR EACH ROW
  WHEN (NEW.meeting_date IS NULL OR NEW.meeting_date = '')
  EXECUTE FUNCTION public.assign_meeting_date_fn();
