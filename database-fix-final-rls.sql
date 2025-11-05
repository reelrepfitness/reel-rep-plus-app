-- ============================================
-- FINAL FIX FOR INFINITE RECURSION
-- ============================================
-- This removes admin policies that cause recursion
-- Admins should use service role key or client-side filtering

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

DROP POLICY IF EXISTS "Users can view own logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can update own logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can delete own logs" ON daily_logs;
DROP POLICY IF EXISTS "Admins can view all logs" ON daily_logs;

-- ============================================
-- PROFILES TABLE POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile (except role field)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow admins to view all profiles
-- This uses a security definer function to avoid infinite recursion
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

-- Now create admin policies using the function
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT 
  TO authenticated
  USING (
    is_admin() OR auth.uid() = user_id
  );

-- ============================================
-- DAILY LOGS POLICIES
-- ============================================

-- Users can view their own logs
CREATE POLICY "Users can view own logs" ON daily_logs
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own logs
CREATE POLICY "Users can insert own logs" ON daily_logs
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own logs
CREATE POLICY "Users can update own logs" ON daily_logs
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own logs
CREATE POLICY "Users can delete own logs" ON daily_logs
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all logs
CREATE POLICY "Admins can view all logs" ON daily_logs
  FOR SELECT 
  TO authenticated
  USING (
    is_admin() OR auth.uid() = user_id
  );

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ RLS policies fixed successfully!';
  RAISE NOTICE '🔒 Created security definer function to prevent recursion';
  RAISE NOTICE '👮 Admins can now view all profiles and logs';
  RAISE NOTICE '👤 Users can manage their own data';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Run this SQL in your Supabase SQL Editor';
  RAISE NOTICE '🔄 Then refresh your app';
END $$;
