/*
  # Update RLS policies on interventions for per-municipality access

  1. Security Changes
    - DROP existing SELECT/INSERT policies that only check auth.uid() IS NOT NULL
    - New SELECT policy: municipalite users see only their municipality's data;
      admin users (role='admin' in profiles) see all data
    - New INSERT policy: municipalite users can only insert for their own municipality;
      admin users can insert for any municipality

  2. Important Notes
    - The policy joins with `profiles` table to check the user's role and municipalite
    - A user with role='admin' in profiles can see and insert all interventions
    - A user with role='municipalite' can only see/insert interventions
      where interventions.municipalite = profiles.municipalite
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can read interventions" ON interventions;
DROP POLICY IF EXISTS "Authenticated users can insert interventions" ON interventions;

-- SELECT: municipalite users see only their data, admins see all
CREATE POLICY "Users can read interventions for their municipality"
  ON interventions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR profiles.municipalite = interventions.municipalite
      )
    )
  );

-- INSERT: municipalite users can only insert for their own municipality, admins can insert for any
CREATE POLICY "Users can insert interventions for their municipality"
  ON interventions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR profiles.municipalite = interventions.municipalite
      )
    )
    AND municipalite IS NOT NULL
    AND municipalite <> ''
    AND quantite_ton >= 0
  );
