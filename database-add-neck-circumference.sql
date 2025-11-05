-- Add neck circumference column to body_measurements table
ALTER TABLE body_measurements 
ADD COLUMN IF NOT EXISTS neck_circumference DECIMAL(5, 2);

-- Add comment for documentation
COMMENT ON COLUMN body_measurements.neck_circumference IS 'Neck circumference measurement in centimeters';
