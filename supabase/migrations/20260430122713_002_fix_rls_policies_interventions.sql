/*
  # Fix RLS policies on interventions table

  1. Security Changes
    - DROP existing permissive policies that use `WITH CHECK (true)` and `USING (true)`
    - These effectively bypass row-level security for authenticated users

  2. New Policies
    - SELECT for authenticated users: requires auth.uid() to exist (proves valid session)
    - SELECT for anon users: removed — unauthenticated access is too permissive
    - INSERT for authenticated users: requires auth.uid() to exist AND validates
      that municipalite is not empty and quantite_ton >= 0

  3. Important Notes
    - The anon SELECT policy is removed entirely since it allowed unrestricted reads
    - All policies now check auth.uid() IS NOT NULL to ensure a valid authenticated session
    - INSERT policy adds WITH CHECK constraints on data integrity
*/

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Authenticated users can read interventions" ON interventions;
DROP POLICY IF EXISTS "Authenticated users can insert interventions" ON interventions;
DROP POLICY IF EXISTS "Public can read interventions" ON interventions;

-- SELECT: authenticated users can read all interventions (valid session required)
CREATE POLICY "Authenticated users can read interventions"
  ON interventions
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- INSERT: authenticated users can insert with data validation
CREATE POLICY "Authenticated users can insert interventions"
  ON interventions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND municipalite IS NOT NULL
    AND municipalite <> ''
    AND quantite_ton >= 0
  );
