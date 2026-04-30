/*
  # Create initial admin user

  1. New Data
    - Creates an admin user in auth.users with email admin@sfax.gov.tn
    - Creates corresponding profile in profiles table with role='admin'

  2. Important Notes
    - Password: admin123 (should be changed after first login)
    - This admin user can see all 23 municipalities' data
    - Additional municipalite users should be created via the admin panel in the UI
*/

-- Create admin auth user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@sfax.gov.tn',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Create admin profile
INSERT INTO profiles (id, email, full_name, municipalite, role)
SELECT id, 'admin@sfax.gov.tn', 'مدير ولاية صفاقس', 'صفاقس', 'admin'
FROM auth.users WHERE email = 'admin@sfax.gov.tn';
