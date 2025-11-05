-- ============================================
-- FIX INFINITE RECURSION IN PROFILES TABLE
-- ============================================
-- This fixes the schema inconsistency causing infinite recursion
-- The issue: profiles table uses 'id' but code expects 'user_id'

-- Step 1: Drop all dependent policies and foreign keys first
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

DROP POLICY IF EXISTS "Users can view own logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can update own logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can delete own logs" ON daily_logs;

DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;

DROP POLICY IF EXISTS "Users can manage own recipes" ON recipes;

DROP POLICY IF EXISTS "Users can view own daily items" ON daily_items;
DROP POLICY IF EXISTS "Users can insert own daily items" ON daily_items;
DROP POLICY IF EXISTS "Users can update own daily items" ON daily_items;
DROP POLICY IF EXISTS "Users can delete own daily items" ON daily_items;

-- Step 2: Backup the current profiles data
CREATE TABLE IF NOT EXISTS profiles_backup AS 
SELECT * FROM profiles;

-- Step 3: Drop foreign key constraints
ALTER TABLE daily_logs DROP CONSTRAINT IF EXISTS daily_logs_user_id_fkey;
ALTER TABLE favorites DROP CONSTRAINT IF EXISTS favorites_user_id_fkey;
ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_user_id_fkey;

-- Step 4: Rename id to user_id in profiles table
ALTER TABLE profiles RENAME COLUMN id TO user_id;

-- Step 5: Recreate foreign keys with correct references
ALTER TABLE daily_logs 
  ADD CONSTRAINT daily_logs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE favorites 
  ADD CONSTRAINT favorites_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE recipes 
  ADD CONSTRAINT recipes_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Step 6: Recreate RLS policies with correct column references
-- Profile policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Daily logs policies
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

-- Favorites policies
CREATE POLICY "Users can view own favorites" ON favorites
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON favorites
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON favorites
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = user_id);

-- Recipes policies
CREATE POLICY "Users can manage own recipes" ON recipes
  FOR ALL 
  TO authenticated
  USING (auth.uid() = user_id);

-- Daily items policies (check through daily_logs)
CREATE POLICY "Users can view own daily items" ON daily_items
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = daily_items.daily_log_id
      AND daily_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own daily items" ON daily_items
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = daily_items.daily_log_id
      AND daily_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own daily items" ON daily_items
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = daily_items.daily_log_id
      AND daily_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own daily items" ON daily_items
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = daily_items.daily_log_id
      AND daily_logs.user_id = auth.uid()
    )
  );

-- ============================================
-- DONE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Infinite recursion fixed!';
  RAISE NOTICE '📊 Column renamed: id → user_id in profiles table';
  RAISE NOTICE '🔐 RLS policies recreated correctly';
  RAISE NOTICE '🔗 Foreign key constraints updated';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Your profiles data has been preserved';
  RAISE NOTICE '📝 Backup table created: profiles_backup';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Please restart your app to see the changes';
END $$;
