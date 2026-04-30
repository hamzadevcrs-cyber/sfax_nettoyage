/*
  # Create 23 municipalite user accounts

  1. New Data
    - Creates 23 auth users, one per municipality
    - Creates 23 corresponding profiles with role='municipalite'
    - Each user can only see interventions for their own municipality

  2. Credentials
    - Password for all: muni1234
    - Email format: [municipality-slug]@sfax.gov.tn
    - Users should change their password after first login

  3. Important Notes
    - Admin already created in previous migration (admin@sfax.gov.tn / admin123)
    - These 23 accounts are for the municipalite operators
*/

-- Create 23 municipalite auth users
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sfax@sfax.gov.tn', crypt('muni1234', gen_salt('bf')), now(), now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sokhra@sfax.gov.tn', crypt('muni1234', gen_salt('bf')), now(), now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'mahres@sfax.gov.tn', crypt('muni1234', gen_salt('bf')), now(), now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'nour@sfax.gov.tn', crypt('muni1234', gen_salt('bf')), now(), now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sakiet-ezzit@sfax.gov.tn', crypt('muni1234', gen_salt('bf')), now(), now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'kerkena@sfax.gov.tn', crypt('muni1234', gen_salt('bf')), now(), now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'hajeb@sfax.gov.tn', crypt('muni1234', gen_salt('bf')), now(), now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'hencha@sfax.gov.tn', crypt('muni1234', gen_salt('bf')), now(), now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'awabed@sfax.gov.tn', crypt('muni1234', gen_salt('bf')), now(), now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'amra@sfax.gov.tn', crypt('muni1234', gen_salt('bf')), now(), now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'chihia@sfax.gov.tn', crypt('muni1234', gen_salt('bf')), now(), now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'ain@sfax.gov.tn', crypt('muni1234', gen_salt('bf')), now(), now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'ghariba@sfax.gov.tn', crypt('muni1234', gen_salt('bf')), now(), now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'nasr@sfax.gov.tn', crypt('muni1234', gen_salt('bf')), now(), now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'bir-ali-chimalia@sfax.gov.tn', crypt('muni1234', gen_salt('bf')), now(), now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'bir-ali-khalifa@sfax.gov.tn', crypt('muni1234', gen_salt('bf')), now(), now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'jbeniana@sfax.gov.tn', crypt('muni1234', gen_salt('bf')), now(), now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'hazq-louza@sfax.gov.tn', crypt('muni1234', gen_salt('bf')), now(), now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'aqarib@sfax.gov.tn', crypt('muni1234', gen_salt('bf')), now(), now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'manzel-chaker@sfax.gov.tn', crypt('muni1234', gen_salt('bf')), now(), now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'qarmada@sfax.gov.tn', crypt('muni1234', gen_salt('bf')), now(), now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sakiet-eddair@sfax.gov.tn', crypt('muni1234', gen_salt('bf')), now(), now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'tina@sfax.gov.tn', crypt('muni1234', gen_salt('bf')), now(), now(), now(), '', '', '', '');

-- Create profiles for all 23 municipalite users
INSERT INTO profiles (id, email, full_name, municipalite, role)
SELECT id, email,
  CASE email
    WHEN 'sfax@sfax.gov.tn' THEN 'مستخدم بلدية صفاقس'
    WHEN 'sokhra@sfax.gov.tn' THEN 'مستخدم بلدية الصخيرة'
    WHEN 'mahres@sfax.gov.tn' THEN 'مستخدم بلدية المحرس'
    WHEN 'nour@sfax.gov.tn' THEN 'مستخدم بلدية النور'
    WHEN 'sakiet-ezzit@sfax.gov.tn' THEN 'مستخدم بلدية ساقية الزيت'
    WHEN 'kerkena@sfax.gov.tn' THEN 'مستخدم بلدية قرقنة'
    WHEN 'hajeb@sfax.gov.tn' THEN 'مستخدم بلدية الحاجب'
    WHEN 'hencha@sfax.gov.tn' THEN 'مستخدم بلدية الحنشة'
    WHEN 'awabed@sfax.gov.tn' THEN 'مستخدم بلدية العوابد الخزانات'
    WHEN 'amra@sfax.gov.tn' THEN 'مستخدم بلدية العامرة'
    WHEN 'chihia@sfax.gov.tn' THEN 'مستخدم بلدية الشيحية'
    WHEN 'ain@sfax.gov.tn' THEN 'مستخدم بلدية العين'
    WHEN 'ghariba@sfax.gov.tn' THEN 'مستخدم بلدية الغريبة'
    WHEN 'nasr@sfax.gov.tn' THEN 'مستخدم بلدية النصر'
    WHEN 'bir-ali-chimalia@sfax.gov.tn' THEN 'مستخدم بلدية بئر علي الشمالية'
    WHEN 'bir-ali-khalifa@sfax.gov.tn' THEN 'مستخدم بلدية بئر علي بن خليفة'
    WHEN 'jbeniana@sfax.gov.tn' THEN 'مستخدم بلدية جبنيانة'
    WHEN 'hazq-louza@sfax.gov.tn' THEN 'مستخدم بلدية حزق اللوزة'
    WHEN 'aqarib@sfax.gov.tn' THEN 'مستخدم بلدية عقارب'
    WHEN 'manzel-chaker@sfax.gov.tn' THEN 'مستخدم بلدية منزل شاكر'
    WHEN 'qarmada@sfax.gov.tn' THEN 'مستخدم بلدية قرمدة'
    WHEN 'sakiet-eddair@sfax.gov.tn' THEN 'مستخدم بلدية ساقية الدائر'
    WHEN 'tina@sfax.gov.tn' THEN 'مستخدم بلدية طينة'
  END,
  CASE email
    WHEN 'sfax@sfax.gov.tn' THEN 'صفاقس'
    WHEN 'sokhra@sfax.gov.tn' THEN 'الصخيرة'
    WHEN 'mahres@sfax.gov.tn' THEN 'المحرس'
    WHEN 'nour@sfax.gov.tn' THEN 'النور'
    WHEN 'sakiet-ezzit@sfax.gov.tn' THEN 'ساقية الزيت'
    WHEN 'kerkena@sfax.gov.tn' THEN 'قرقنة'
    WHEN 'hajeb@sfax.gov.tn' THEN 'الحاجب'
    WHEN 'hencha@sfax.gov.tn' THEN 'الحنشة'
    WHEN 'awabed@sfax.gov.tn' THEN 'العوابد الخزانات'
    WHEN 'amra@sfax.gov.tn' THEN 'العامرة'
    WHEN 'chihia@sfax.gov.tn' THEN 'الشيحية'
    WHEN 'ain@sfax.gov.tn' THEN 'العين'
    WHEN 'ghariba@sfax.gov.tn' THEN 'الغريبة'
    WHEN 'nasr@sfax.gov.tn' THEN 'النصر'
    WHEN 'bir-ali-chimalia@sfax.gov.tn' THEN 'بئر علي الشمالية'
    WHEN 'bir-ali-khalifa@sfax.gov.tn' THEN 'بئر علي بن خليفة'
    WHEN 'jbeniana@sfax.gov.tn' THEN 'جبنيانة'
    WHEN 'hazq-louza@sfax.gov.tn' THEN 'حزق اللوزة'
    WHEN 'aqarib@sfax.gov.tn' THEN 'عقارب'
    WHEN 'manzel-chaker@sfax.gov.tn' THEN 'منزل شاكر'
    WHEN 'qarmada@sfax.gov.tn' THEN 'قرمدة'
    WHEN 'sakiet-eddair@sfax.gov.tn' THEN 'ساقية الدائر'
    WHEN 'tina@sfax.gov.tn' THEN 'طينة'
  END,
  'municipalite'
FROM auth.users
WHERE email != 'admin@sfax.gov.tn'
AND email NOT IN (SELECT email FROM profiles);
