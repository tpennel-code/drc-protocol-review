-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('reviewer', 'executive', 'admin');
CREATE TYPE review_recommendation AS ENUM ('approved', 'minor_amendment', 'major_amendment', 'rejected');
CREATE TYPE outcome_status AS ENUM ('pending', 'approved', 'minor_amendment', 'major_amendment', 'rejected', 'rolled_over', 'na');

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  firstname TEXT,
  surname TEXT,
  role user_role NOT NULL DEFAULT 'reviewer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROTOCOLS (imported from FileMaker CSV)
-- ============================================================
CREATE TABLE public.protocols (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  protocol_number TEXT,
  serial_text TEXT,
  title TEXT,
  approved_title TEXT,
  study_type TEXT,
  submission_type TEXT,
  degree TEXT,
  fast_tracked BOOLEAN,
  submitted_at TIMESTAMPTZ,
  final_outcome outcome_status DEFAULT 'pending',
  approval_date DATE,
  meeting_date TEXT,
  meeting_outcome TEXT,
  applicant_email TEXT,
  applicant_firstname TEXT,
  applicant_surname TEXT,
  applicant_title TEXT,
  supervisor TEXT,
  reviewer_comments TEXT,
  amendment_letter_status TEXT,
  approval_letter_status TEXT,
  amendment_date TEXT,
  protocol_file TEXT,
  datasheet_file TEXT,
  supplementary_file TEXT,
  checklist TEXT,
  submission_id TEXT,
  year TEXT,
  year_submitted TEXT,
  list_amendments TEXT,
  page_count INTEGER,
  if_resubmission_drc_number TEXT,
  omit_record BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROTOCOL ASSIGNMENTS
-- ============================================================
CREATE TABLE public.protocol_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  protocol_id UUID REFERENCES public.protocols(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES public.profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  UNIQUE(protocol_id, reviewer_id)
);

-- ============================================================
-- REVIEWS (submitted by reviewers)
-- ============================================================
CREATE TABLE public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  protocol_id UUID REFERENCES public.protocols(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recommendation review_recommendation,
  comments TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(protocol_id, reviewer_id)
);

-- ============================================================
-- EMAIL LOGS
-- ============================================================
CREATE TABLE public.email_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  protocol_id UUID REFERENCES public.protocols(id) ON DELETE CASCADE,
  sent_by UUID REFERENCES public.profiles(id),
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocol_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- PROFILES policies
CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT USING (id = auth.uid());

CREATE POLICY "Executives and admins view all profiles"
  ON public.profiles FOR SELECT USING (get_user_role() IN ('executive', 'admin'));

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins update any profile"
  ON public.profiles FOR UPDATE USING (get_user_role() = 'admin');

-- PROTOCOLS policies
CREATE POLICY "Executives and admins view all protocols"
  ON public.protocols FOR SELECT USING (get_user_role() IN ('executive', 'admin'));

CREATE POLICY "Reviewers view assigned protocols"
  ON public.protocols FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.protocol_assignments
      WHERE protocol_id = protocols.id AND reviewer_id = auth.uid()
    )
  );

CREATE POLICY "Executives and admins insert protocols"
  ON public.protocols FOR INSERT WITH CHECK (get_user_role() IN ('executive', 'admin'));

CREATE POLICY "Executives and admins update protocols"
  ON public.protocols FOR UPDATE USING (get_user_role() IN ('executive', 'admin'));

-- PROTOCOL ASSIGNMENTS policies
CREATE POLICY "Executives and admins manage assignments"
  ON public.protocol_assignments FOR ALL USING (get_user_role() IN ('executive', 'admin'));

CREATE POLICY "Reviewers view own assignments"
  ON public.protocol_assignments FOR SELECT USING (reviewer_id = auth.uid());

-- REVIEWS policies
CREATE POLICY "Reviewers manage own reviews"
  ON public.reviews FOR ALL USING (reviewer_id = auth.uid());

CREATE POLICY "Executives and admins view all reviews"
  ON public.reviews FOR SELECT USING (get_user_role() IN ('executive', 'admin'));

-- EMAIL LOGS policies
CREATE POLICY "Executives and admins manage email logs"
  ON public.email_logs FOR ALL USING (get_user_role() IN ('executive', 'admin'));

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- AUTO-UPDATE updated_at ON PROTOCOLS
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protocols_updated_at
  BEFORE UPDATE ON public.protocols
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
