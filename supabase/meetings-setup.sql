-- ============================================================
-- Submission Deadlines & Meeting Dates
-- Run in Supabase SQL editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.submission_deadlines (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  deadline_date DATE NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.meeting_dates (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  meeting_date DATE NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.submission_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_dates        ENABLE ROW LEVEL SECURITY;

-- Anyone can read (public submission form shows next deadline)
CREATE POLICY "Public read submission deadlines"
  ON public.submission_deadlines FOR SELECT USING (true);

CREATE POLICY "Public read meeting dates"
  ON public.meeting_dates FOR SELECT USING (true);

-- Only exec/admin can manage
CREATE POLICY "Executives manage submission deadlines"
  ON public.submission_deadlines FOR ALL
  USING (get_user_role() IN ('executive', 'admin'))
  WITH CHECK (get_user_role() IN ('executive', 'admin'));

CREATE POLICY "Executives manage meeting dates"
  ON public.meeting_dates FOR ALL
  USING (get_user_role() IN ('executive', 'admin'))
  WITH CHECK (get_user_role() IN ('executive', 'admin'));

-- ── 2026 data ────────────────────────────────────────────────

INSERT INTO public.submission_deadlines (deadline_date) VALUES
  ('2026-02-06'),
  ('2026-03-06'),
  ('2026-04-07'),
  ('2026-05-08'),
  ('2026-06-05'),
  ('2026-07-10'),
  ('2026-08-07'),
  ('2026-09-11'),
  ('2026-10-09'),
  ('2026-11-06');

INSERT INTO public.meeting_dates (meeting_date) VALUES
  ('2026-02-13'),
  ('2026-03-13'),
  ('2026-04-10'),
  ('2026-05-15'),
  ('2026-06-12'),
  ('2026-07-17'),
  ('2026-08-14'),
  ('2026-09-18'),
  ('2026-10-16'),
  ('2026-11-13');
