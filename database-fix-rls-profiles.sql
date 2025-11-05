-- ============================================
-- FIX RLS POLICIES FOR PROFILES TABLE
-- ============================================

-- Drop existing profile policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Recreate policies with proper permissions
-- Allow authenticated users to select their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own profile
-- This is crucial for new user registration
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix daily_logs RLS policies to also work properly
DROP POLICY IF EXISTS "Users can view own logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can update own logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can delete own logs" ON daily_logs;
DROP POLICY IF EXISTS "Admins can view all logs" ON daily_logs;

CREATE POLICY "Users can view own logs" ON daily_logs
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" ON daily_logs
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs" ON daily_logs
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs" ON daily_logs
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = user_id);

DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies fixed successfully!';
  RAISE NOTICE '👤 Users can now create and manage their own profiles';
  RAISE NOTICE '⚠️  Admin policies removed to prevent infinite recursion';
  RAISE NOTICE '💡 If you need admin features, implement them using service role key on backend';
END $$;
