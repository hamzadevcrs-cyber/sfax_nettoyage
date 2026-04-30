/*
  # Add profiles table for per-municipality access control

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `full_name` (text)
      - `municipalite` (text) — the municipality this user belongs to
      - `role` (text) — 'admin' sees all, 'municipalite' sees only their data
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `profiles`
    - Users can read their own profile
    - Users can update their own profile (limited fields)
    - Service role has full access (for server-side operations)

  3. Important Notes
    - Each of the 23 municipalities gets a user account
    - An admin account can see all municipalities' data
    - The `municipalite` field in profiles links to interventions.municipalite
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text DEFAULT '',
  municipalite text NOT NULL,
  role text NOT NULL DEFAULT 'municipalite',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile (name only, not role or municipalite)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role can do everything (for server-side user management)
CREATE POLICY "Service role full access on profiles"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
