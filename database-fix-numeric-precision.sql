-- Fix numeric field overflow - increase precision for body measurements
-- Change DECIMAL(5, 2) to DECIMAL(7, 2) to support values up to 99999.99

ALTER TABLE body_measurements 
  ALTER COLUMN body_weight TYPE DECIMAL(7, 2),
  ALTER COLUMN body_fat_mass TYPE DECIMAL(7, 2),
  ALTER COLUMN lean_mass TYPE DECIMAL(7, 2),
  ALTER COLUMN shoulder_circumference TYPE DECIMAL(7, 2),
  ALTER COLUMN waist_circumference TYPE DECIMAL(7, 2),
  ALTER COLUMN arm_circumference TYPE DECIMAL(7, 2),
  ALTER COLUMN thigh_circumference TYPE DECIMAL(7, 2),
  ALTER COLUMN neck_circumference TYPE DECIMAL(7, 2);

-- Also fix body_fat_percentage if needed (should be fine at 4,2 but let's make it consistent)
ALTER TABLE body_measurements 
  ALTER COLUMN body_fat_percentage TYPE DECIMAL(6, 2);
