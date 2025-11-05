-- ============================================
-- FIX ADMIN ACCESS TO VIEW ALL PROFILES
-- ============================================

-- Add policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT 
  TO authenticated
  USING (
    -- Admin can see all profiles
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
    -- OR user can see their own profile
    OR auth.uid() = user_id
  );

-- Add policy for admins to view all daily logs
CREATE POLICY "Admins can view all logs" ON daily_logs
  FOR SELECT 
  TO authenticated
  USING (
    -- Admin can see all logs
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
    -- OR user can see their own logs
    OR auth.uid() = user_id
  );

-- Add policy for admins to update all profiles
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

DO $$
BEGIN
  RAISE NOTICE '✅ Admin access policies created successfully!';
  RAISE NOTICE '👮 Admins can now view and manage all profiles';
  RAISE NOTICE '👀 Admins can view all daily logs';
END $$;
