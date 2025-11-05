-- Add weekly workout goal columns to profiles table

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS weekly_cardio_minutes NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekly_strength_workouts NUMERIC DEFAULT 0;

COMMENT ON COLUMN profiles.weekly_cardio_minutes IS 'Target minutes of cardio exercise per week';
COMMENT ON COLUMN profiles.weekly_strength_workouts IS 'Target number of strength training workouts per week';
