-- Creates three demo users for sandbox testing.
-- Run this in Supabase SQL Editor AFTER running schema.sql.
-- Password for all demo accounts: demo1234

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(), 'authenticated', 'authenticated',
    'reviewer@demo.drc', crypt('demo1234', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}', '{}',
    '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(), 'authenticated', 'authenticated',
    'executive@demo.drc', crypt('demo1234', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}', '{}',
    '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(), 'authenticated', 'authenticated',
    'admin@demo.drc', crypt('demo1234', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}', '{}',
    '', '', '', ''
  );

-- Set roles and display names
UPDATE public.profiles SET role = 'reviewer',  firstname = 'Demo', surname = 'Reviewer'  WHERE email = 'reviewer@demo.drc';
UPDATE public.profiles SET role = 'executive', firstname = 'Demo', surname = 'Executive' WHERE email = 'executive@demo.drc';
UPDATE public.profiles SET role = 'admin',     firstname = 'Demo', surname = 'Admin'     WHERE email = 'admin@demo.drc';
