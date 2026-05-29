-- Force a password change after the default "<Surname>123" login.
-- Run in the Supabase SQL editor (blank query, not the AI Assistant).

-- 1. Flag column. New accounts default to requiring a change.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Everyone currently in the system is on the default <Surname>123 password,
--    so require all active users to change it on next login.
UPDATE public.profiles
  SET must_change_password = TRUE
  WHERE COALESCE(archived, FALSE) = FALSE;
