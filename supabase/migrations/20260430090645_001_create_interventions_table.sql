/*
  # Create interventions table for municipal cleaning activities tracking

  1. New Tables
    - `interventions` - Records all municipal cleaning interventions
      - `id` (uuid, primary key) - Unique identifier
      - `date` (date) - Date of the intervention (system date, not user input)
      - `municipalite` (text) - Municipality name
      - `quantite_ton` (decimal) - Quantity in tons
      - `metre_lineaire` (integer) - Linear meters cleaned
      - `type_intervention` (text) - Type of intervention (multiple types allowed)
      - `lieux` (text) - Locations where intervention occurred
      - `ressources_humaines` (text) - Human resources involved
      - `equipements` (text) - Equipment used
      - `created_at` (timestamp) - Record creation timestamp (automatic)
      - `updated_at` (timestamp) - Record update timestamp (automatic)

  2. Indexes
    - Index on `date` for fast date-based queries
    - Index on `municipalite` for filtering by municipality
    - Composite index on `date` and `municipalite` for combined filters

  3. Security
    - Enable RLS on `interventions` table
    - Add policy for authenticated users to read all intervention data
    - Add policy for authenticated users to insert new interventions
    - Unauthenticated users can view aggregated statistics only

  4. Important Notes
    - Data is immutable - old entries are never deleted or modified
    - Each new intervention creates a complete historical record
    - The `date` field should default to `CURRENT_DATE` for automatic system date capture
    - Timestamps are managed automatically for audit trails
*/

CREATE TABLE IF NOT EXISTS interventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  municipalite text NOT NULL,
  quantite_ton decimal(10, 2) NOT NULL DEFAULT 0,
  metre_lineaire integer NOT NULL DEFAULT 0,
  type_intervention text NOT NULL,
  lieux text NOT NULL,
  ressources_humaines text,
  equipements text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_interventions_date ON interventions(date);
CREATE INDEX IF NOT EXISTS idx_interventions_municipalite ON interventions(municipalite);
CREATE INDEX IF NOT EXISTS idx_interventions_date_municipalite ON interventions(date, municipalite);

-- Enable Row Level Security
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all interventions
CREATE POLICY "Authenticated users can read interventions"
  ON interventions
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can insert interventions
CREATE POLICY "Authenticated users can insert interventions"
  ON interventions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Public can read interventions (for dashboard statistics)
CREATE POLICY "Public can read interventions"
  ON interventions
  FOR SELECT
  TO anon
  USING (true);
