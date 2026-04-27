-- Step 1: Add new columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS professional_title TEXT,
  ADD COLUMN IF NOT EXISTS division TEXT,
  ADD COLUMN IF NOT EXISTS portfolio TEXT;

-- Step 2: Insert all reviewers
DO $$
DECLARE
  v_id uuid;
  v_cols TEXT := 'instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data,confirmation_token,email_change,email_change_token_new,recovery_token';
BEGIN

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email='c.warden@uct.ac.za') THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      'c.warden@uct.ac.za', crypt('ChangeMe2024!', gen_salt('bf')),
      NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '');
    INSERT INTO public.profiles (id, email, professional_title, firstname, surname, role, division, portfolio)
    VALUES (v_id, 'c.warden@uct.ac.za', 'Dr', 'Claire', 'Warden', 'executive', 'General Surgery', 'Chairperson')
    ON CONFLICT (id) DO UPDATE SET professional_title=EXCLUDED.professional_title, firstname=EXCLUDED.firstname, surname=EXCLUDED.surname, role=EXCLUDED.role, division=EXCLUDED.division, portfolio=EXCLUDED.portfolio;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email='marion.arnold@drc.local') THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      'marion.arnold@drc.local', crypt('ChangeMe2024!', gen_salt('bf')),
      NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '');
    INSERT INTO public.profiles (id, email, professional_title, firstname, surname, role, division, portfolio)
    VALUES (v_id, 'marion.arnold@drc.local', 'Dr', 'Marion', 'Arnold', 'reviewer', 'Paediatric Surgery', 'Red Cross Children''s Hospital')
    ON CONFLICT (id) DO UPDATE SET professional_title=EXCLUDED.professional_title, firstname=EXCLUDED.firstname, surname=EXCLUDED.surname, role=EXCLUDED.role, division=EXCLUDED.division, portfolio=EXCLUDED.portfolio;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email='marc.bernon@drc.local') THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      'marc.bernon@drc.local', crypt('ChangeMe2024!', gen_salt('bf')),
      NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '');
    INSERT INTO public.profiles (id, email, professional_title, firstname, surname, role, division, portfolio)
    VALUES (v_id, 'marc.bernon@drc.local', 'A/Prof', 'Marc', 'Bernon', 'reviewer', 'General Surgery', 'Protocol Review')
    ON CONFLICT (id) DO UPDATE SET professional_title=EXCLUDED.professional_title, firstname=EXCLUDED.firstname, surname=EXCLUDED.surname, role=EXCLUDED.role, division=EXCLUDED.division, portfolio=EXCLUDED.portfolio;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email='andre.brooks@drc.local') THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      'andre.brooks@drc.local', crypt('ChangeMe2024!', gen_salt('bf')),
      NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '');
    INSERT INTO public.profiles (id, email, professional_title, firstname, surname, role, division, portfolio)
    VALUES (v_id, 'andre.brooks@drc.local', 'A/Prof', 'Andre', 'Brooks', 'reviewer', 'Cardiothoracic Surgery', 'Research Integrity')
    ON CONFLICT (id) DO UPDATE SET professional_title=EXCLUDED.professional_title, firstname=EXCLUDED.firstname, surname=EXCLUDED.surname, role=EXCLUDED.role, division=EXCLUDED.division, portfolio=EXCLUDED.portfolio;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email='neil.davies@drc.local') THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      'neil.davies@drc.local', crypt('ChangeMe2024!', gen_salt('bf')),
      NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '');
    INSERT INTO public.profiles (id, email, professional_title, firstname, surname, role, division, portfolio)
    VALUES (v_id, 'neil.davies@drc.local', 'Prof', 'Neil', 'Davies', 'reviewer', 'Cardiothoracic Surgery', 'AEC')
    ON CONFLICT (id) DO UPDATE SET professional_title=EXCLUDED.professional_title, firstname=EXCLUDED.firstname, surname=EXCLUDED.surname, role=EXCLUDED.role, division=EXCLUDED.division, portfolio=EXCLUDED.portfolio;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email='stewart.dix-peek@drc.local') THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      'stewart.dix-peek@drc.local', crypt('ChangeMe2024!', gen_salt('bf')),
      NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '');
    INSERT INTO public.profiles (id, email, professional_title, firstname, surname, role, division, portfolio)
    VALUES (v_id, 'stewart.dix-peek@drc.local', 'Dr', 'Stewart', 'Dix-Peek', 'reviewer', 'Orthopaedic Surgery', 'Red Cross Children''s Hospital')
    ON CONFLICT (id) DO UPDATE SET professional_title=EXCLUDED.professional_title, firstname=EXCLUDED.firstname, surname=EXCLUDED.surname, role=EXCLUDED.role, division=EXCLUDED.division, portfolio=EXCLUDED.portfolio;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email='tinus.dutoit@drc.local') THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      'tinus.dutoit@drc.local', crypt('ChangeMe2024!', gen_salt('bf')),
      NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '');
    INSERT INTO public.profiles (id, email, professional_title, firstname, surname, role, division, portfolio)
    VALUES (v_id, 'tinus.dutoit@drc.local', 'Dr', 'Tinus', 'Du Toit', 'reviewer', 'General Surgery', 'Protocol Review')
    ON CONFLICT (id) DO UPDATE SET professional_title=EXCLUDED.professional_title, firstname=EXCLUDED.firstname, surname=EXCLUDED.surname, role=EXCLUDED.role, division=EXCLUDED.division, portfolio=EXCLUDED.portfolio;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email='nicola.freeman@drc.local') THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      'nicola.freeman@drc.local', crypt('ChangeMe2024!', gen_salt('bf')),
      NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '');
    INSERT INTO public.profiles (id, email, professional_title, firstname, surname, role, division, portfolio)
    VALUES (v_id, 'nicola.freeman@drc.local', 'Dr', 'Nicola', 'Freeman', 'reviewer', 'Ophthalmology', 'Protocol Review')
    ON CONFLICT (id) DO UPDATE SET professional_title=EXCLUDED.professional_title, firstname=EXCLUDED.firstname, surname=EXCLUDED.surname, role=EXCLUDED.role, division=EXCLUDED.division, portfolio=EXCLUDED.portfolio;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email='moses.isiagi@drc.local') THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      'moses.isiagi@drc.local', crypt('ChangeMe2024!', gen_salt('bf')),
      NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '');
    INSERT INTO public.profiles (id, email, professional_title, firstname, surname, role, division, portfolio)
    VALUES (v_id, 'moses.isiagi@drc.local', 'Dr', 'Moses', 'Isiagi', 'reviewer', 'Global Surgery', 'MMed Funding / Grant application support')
    ON CONFLICT (id) DO UPDATE SET professional_title=EXCLUDED.professional_title, firstname=EXCLUDED.firstname, surname=EXCLUDED.surname, role=EXCLUDED.role, division=EXCLUDED.division, portfolio=EXCLUDED.portfolio;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email='lisa.kaestner@drc.local') THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      'lisa.kaestner@drc.local', crypt('ChangeMe2024!', gen_salt('bf')),
      NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '');
    INSERT INTO public.profiles (id, email, professional_title, firstname, surname, role, division, portfolio)
    VALUES (v_id, 'lisa.kaestner@drc.local', 'A/Prof', 'Lisa', 'Kaestner', 'reviewer', 'Urology', 'AEC')
    ON CONFLICT (id) DO UPDATE SET professional_title=EXCLUDED.professional_title, firstname=EXCLUDED.firstname, surname=EXCLUDED.surname, role=EXCLUDED.role, division=EXCLUDED.division, portfolio=EXCLUDED.portfolio;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email='jimmy.kauta@drc.local') THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      'jimmy.kauta@drc.local', crypt('ChangeMe2024!', gen_salt('bf')),
      NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '');
    INSERT INTO public.profiles (id, email, professional_title, firstname, surname, role, division, portfolio)
    VALUES (v_id, 'jimmy.kauta@drc.local', 'Dr', 'Jimmy', 'Kauta', 'reviewer', 'Orthopaedic Surgery', 'Protocol Review')
    ON CONFLICT (id) DO UPDATE SET professional_title=EXCLUDED.professional_title, firstname=EXCLUDED.firstname, surname=EXCLUDED.surname, role=EXCLUDED.role, division=EXCLUDED.division, portfolio=EXCLUDED.portfolio;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email='jeannie.mccaul@drc.local') THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      'jeannie.mccaul@drc.local', crypt('ChangeMe2024!', gen_salt('bf')),
      NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '');
    INSERT INTO public.profiles (id, email, professional_title, firstname, surname, role, division, portfolio)
    VALUES (v_id, 'jeannie.mccaul@drc.local', 'Dr', 'Jeannie', 'McCaul', 'reviewer', 'Orthopaedic Surgery', 'Protocol Review')
    ON CONFLICT (id) DO UPDATE SET professional_title=EXCLUDED.professional_title, firstname=EXCLUDED.firstname, surname=EXCLUDED.surname, role=EXCLUDED.role, division=EXCLUDED.division, portfolio=EXCLUDED.portfolio;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email='chima.ofoegbu@drc.local') THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      'chima.ofoegbu@drc.local', crypt('ChangeMe2024!', gen_salt('bf')),
      NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '');
    INSERT INTO public.profiles (id, email, professional_title, firstname, surname, role, division, portfolio)
    VALUES (v_id, 'chima.ofoegbu@drc.local', 'Dr', 'Chima', 'Ofoegbu', 'reviewer', 'Cardiothoracic Surgery', 'CRC protocol review')
    ON CONFLICT (id) DO UPDATE SET professional_title=EXCLUDED.professional_title, firstname=EXCLUDED.firstname, surname=EXCLUDED.surname, role=EXCLUDED.role, division=EXCLUDED.division, portfolio=EXCLUDED.portfolio;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email='shazia.peer@drc.local') THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      'shazia.peer@drc.local', crypt('ChangeMe2024!', gen_salt('bf')),
      NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '');
    INSERT INTO public.profiles (id, email, professional_title, firstname, surname, role, division, portfolio)
    VALUES (v_id, 'shazia.peer@drc.local', 'Prof', 'Shazia', 'Peer', 'reviewer', 'ENT', 'UCT grants & Equipment')
    ON CONFLICT (id) DO UPDATE SET professional_title=EXCLUDED.professional_title, firstname=EXCLUDED.firstname, surname=EXCLUDED.surname, role=EXCLUDED.role, division=EXCLUDED.division, portfolio=EXCLUDED.portfolio;
  END IF;

  UPDATE public.profiles
  SET professional_title='Prof', firstname='Tim', surname='Pennel',
      role='admin', division='Cardiothoracic Surgery', portfolio='Website & Database'
  WHERE email='tim.pennel@uct.ac.za';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email='christopher.tinley@drc.local') THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      'christopher.tinley@drc.local', crypt('ChangeMe2024!', gen_salt('bf')),
      NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '');
    INSERT INTO public.profiles (id, email, professional_title, firstname, surname, role, division, portfolio)
    VALUES (v_id, 'christopher.tinley@drc.local', 'A/Prof', 'Christopher', 'Tinley', 'reviewer', 'Ophthalmology', 'MMed Support')
    ON CONFLICT (id) DO UPDATE SET professional_title=EXCLUDED.professional_title, firstname=EXCLUDED.firstname, surname=EXCLUDED.surname, role=EXCLUDED.role, division=EXCLUDED.division, portfolio=EXCLUDED.portfolio;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email='maritz.laubscher@drc.local') THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      'maritz.laubscher@drc.local', crypt('ChangeMe2024!', gen_salt('bf')),
      NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '');
    INSERT INTO public.profiles (id, email, professional_title, firstname, surname, role, division, portfolio)
    VALUES (v_id, 'maritz.laubscher@drc.local', 'Prof', 'Maritz', 'Laubscher', 'executive', 'Orthopaedic Surgery', 'Past Chair')
    ON CONFLICT (id) DO UPDATE SET professional_title=EXCLUDED.professional_title, firstname=EXCLUDED.firstname, surname=EXCLUDED.surname, role=EXCLUDED.role, division=EXCLUDED.division, portfolio=EXCLUDED.portfolio;
  END IF;

END $$;
