-- Reset all reviewer passwords to their surname (as used by the login form)
-- Run this in the Supabase SQL Editor

-- Tim Pennel (admin) — create auth user if missing, then set password
DO $$
DECLARE v_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'tim.pennel@uct.ac.za') THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      'tim.pennel@uct.ac.za', crypt('Pennel', gen_salt('bf')),
      NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '');
    INSERT INTO public.profiles (id, email, professional_title, firstname, surname, role, division, portfolio)
    VALUES (v_id, 'tim.pennel@uct.ac.za', 'Prof', 'Tim', 'Pennel', 'admin', 'Cardiothoracic Surgery', 'Website & Database')
    ON CONFLICT (id) DO UPDATE SET professional_title=EXCLUDED.professional_title, firstname=EXCLUDED.firstname,
      surname=EXCLUDED.surname, role=EXCLUDED.role, division=EXCLUDED.division, portfolio=EXCLUDED.portfolio;
  ELSE
    UPDATE auth.users SET encrypted_password = crypt('Pennel', gen_salt('bf')) WHERE email = 'tim.pennel@uct.ac.za';
  END IF;
END $$;

-- Update all other reviewer/executive passwords to their surname
UPDATE auth.users SET encrypted_password = crypt('Warden',    gen_salt('bf')) WHERE email = 'c.warden@uct.ac.za';
UPDATE auth.users SET encrypted_password = crypt('Arnold',    gen_salt('bf')) WHERE email = 'marion.arnold@drc.local';
UPDATE auth.users SET encrypted_password = crypt('Bernon',    gen_salt('bf')) WHERE email = 'marc.bernon@drc.local';
UPDATE auth.users SET encrypted_password = crypt('Brooks',    gen_salt('bf')) WHERE email = 'andre.brooks@drc.local';
UPDATE auth.users SET encrypted_password = crypt('Davies',    gen_salt('bf')) WHERE email = 'neil.davies@drc.local';
UPDATE auth.users SET encrypted_password = crypt('Dix-Peek',  gen_salt('bf')) WHERE email = 'stewart.dix-peek@drc.local';
UPDATE auth.users SET encrypted_password = crypt('Du Toit',   gen_salt('bf')) WHERE email = 'tinus.dutoit@drc.local';
UPDATE auth.users SET encrypted_password = crypt('Freeman',   gen_salt('bf')) WHERE email = 'nicola.freeman@drc.local';
UPDATE auth.users SET encrypted_password = crypt('Isiagi',    gen_salt('bf')) WHERE email = 'moses.isiagi@drc.local';
UPDATE auth.users SET encrypted_password = crypt('Kaestner',  gen_salt('bf')) WHERE email = 'lisa.kaestner@drc.local';
UPDATE auth.users SET encrypted_password = crypt('Kauta',     gen_salt('bf')) WHERE email = 'jimmy.kauta@drc.local';
UPDATE auth.users SET encrypted_password = crypt('McCaul',    gen_salt('bf')) WHERE email = 'jeannie.mccaul@drc.local';
UPDATE auth.users SET encrypted_password = crypt('Ofoegbu',   gen_salt('bf')) WHERE email = 'chima.ofoegbu@drc.local';
UPDATE auth.users SET encrypted_password = crypt('Peer',      gen_salt('bf')) WHERE email = 'shazia.peer@drc.local';
UPDATE auth.users SET encrypted_password = crypt('Tinley',    gen_salt('bf')) WHERE email = 'christopher.tinley@drc.local';
UPDATE auth.users SET encrypted_password = crypt('Laubscher', gen_salt('bf')) WHERE email = 'maritz.laubscher@drc.local';
