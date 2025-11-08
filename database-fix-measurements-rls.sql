-- ============================================
-- FIX RLS FOR BODY MEASUREMENTS
-- Allow admins to insert/update measurements for clients
-- ============================================

-- First, let's make sure is_admin function exists (from previous fixes)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own measurements" ON body_measurements;
DROP POLICY IF EXISTS "Users can insert their own measurements" ON body_measurements;
DROP POLICY IF EXISTS "Users can update their own measurements" ON body_measurements;
DROP POLICY IF EXISTS "Users can delete their own measurements" ON body_measurements;
DROP POLICY IF EXISTS "Coaches can view all measurements" ON body_measurements;
DROP POLICY IF EXISTS "Admins can insert client measurements" ON body_measurements;
DROP POLICY IF EXISTS "Admins can update client measurements" ON body_measurements;

-- ============================================
-- BODY MEASUREMENTS POLICIES
-- ============================================

-- Users can view their own measurements
CREATE POLICY "Users can view their own measurements"
  ON body_measurements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

-- Users can insert their own measurements
CREATE POLICY "Users can insert their own measurements"
  ON body_measurements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can insert measurements for any user
CREATE POLICY "Admins can insert client measurements"
  ON body_measurements FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Users can update their own measurements
CREATE POLICY "Users can update their own measurements"
  ON body_measurements FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can update any measurements
CREATE POLICY "Admins can update client measurements"
  ON body_measurements FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Users can delete their own measurements
CREATE POLICY "Users can delete their own measurements"
  ON body_measurements FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Body measurements RLS policies fixed successfully!';
  RAISE NOTICE '🔒 Admins can now insert/update measurements for clients';
  RAISE NOTICE '👤 Users can still manage their own measurements';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Run this SQL in your Supabase SQL Editor';
  RAISE NOTICE '🔄 Then try updating measurements again';
END $$;
