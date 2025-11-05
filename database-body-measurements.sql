-- Body Measurements Table
CREATE TABLE IF NOT EXISTS body_measurements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Weight measurements (kg)
  body_weight DECIMAL(5, 2),
  body_fat_mass DECIMAL(5, 2),
  lean_mass DECIMAL(5, 2),
  
  -- Body fat percentage
  body_fat_percentage DECIMAL(4, 2),
  
  -- Circumference measurements (cm)
  shoulder_circumference DECIMAL(5, 2),
  waist_circumference DECIMAL(5, 2),
  arm_circumference DECIMAL(5, 2),
  thigh_circumference DECIMAL(5, 2),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure user has only one measurement per date
  UNIQUE(user_id, measurement_date)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_date 
ON body_measurements(user_id, measurement_date DESC);

-- Enable RLS
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own measurements"
  ON body_measurements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own measurements"
  ON body_measurements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own measurements"
  ON body_measurements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own measurements"
  ON body_measurements FOR DELETE
  USING (auth.uid() = user_id);

-- Coaches and admins can view all measurements
CREATE POLICY "Coaches can view all measurements"
  ON body_measurements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('coach', 'admin')
    )
  );

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_body_measurements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_body_measurements_updated_at
  BEFORE UPDATE ON body_measurements
  FOR EACH ROW
  EXECUTE FUNCTION update_body_measurements_updated_at();
