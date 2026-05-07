-- When a reviewer saves a review, automatically mark their protocol_assignment
-- as 'completed'. Reviewers' RLS only allows SELECT on protocol_assignments,
-- so the client-side update was being silently rejected. SECURITY DEFINER lets
-- the trigger bypass RLS for this specific update.

CREATE OR REPLACE FUNCTION public.mark_assignment_completed_on_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.protocol_assignments
  SET status = 'completed'
  WHERE protocol_id = NEW.protocol_id
    AND reviewer_id = NEW.reviewer_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_mark_assignment_completed ON public.reviews;
CREATE TRIGGER reviews_mark_assignment_completed
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.mark_assignment_completed_on_review();

-- Backfill: any existing review should have its assignment marked completed
UPDATE public.protocol_assignments pa
SET status = 'completed'
FROM public.reviews r
WHERE pa.protocol_id = r.protocol_id
  AND pa.reviewer_id = r.reviewer_id
  AND pa.status IS DISTINCT FROM 'completed';
