ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

-- Allow executives (not just admins) to update any profile — needed for archive action
DROP POLICY IF EXISTS "Admins update any profile" ON public.profiles;
CREATE POLICY "Executives and admins update any profile"
  ON public.profiles FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('executive', 'admin')
  );
