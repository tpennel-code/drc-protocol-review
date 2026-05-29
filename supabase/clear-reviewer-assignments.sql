-- Remove ALL reviewer assignments (test data from manual testing).
-- After running, every protocol shows "No reviewers assigned".
-- This does NOT delete any protocols. Run in the Supabase SQL editor.

-- See what will be removed first:
SELECT count(*) AS assignments_to_delete FROM public.protocol_assignments;

-- Then clear them:
DELETE FROM public.protocol_assignments;
