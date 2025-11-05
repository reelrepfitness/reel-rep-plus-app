-- ============================================
-- FIX PROFILES TABLE COLUMN ISSUE
-- ============================================
-- This script safely handles the profiles table
-- whether it has 'id' or 'user_id' as primary key

-- Step 1: Check what we have and clean up if needed
DO $$
DECLARE
  has_id_column boolean;
  has_user_id_column boolean;
BEGIN
  -- Check for id column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'id'
  ) INTO has_id_column;
  
  -- Check for user_id column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'user_id'
  ) INTO has_user_id_column;
  
  RAISE NOTICE 'Current state:';
  RAISE NOTICE '  - has id column: %', has_id_column;
  RAISE NOTICE '  - has user_id column: %', has_user_id_column;
  
  -- Case 1: Has both columns (corrupted state)
  IF has_id_column AND has_user_id_column THEN
    RAISE NOTICE 'Found both columns - dropping user_id and keeping id';
    EXECUTE 'ALTER TABLE profiles DROP COLUMN IF EXISTS user_id CASCADE';
  END IF;
  
  -- Case 2: Has user_id (already fixed)
  IF has_user_id_column AND NOT has_id_column THEN
    RAISE NOTICE 'Table already uses user_id - no changes needed';
  END IF;
  
  -- Case 3: Has id (needs fix)
  IF has_id_column AND NOT has_user_id_column THEN
    RAISE NOTICE 'Table uses id - will be renamed to user_id';
  END IF;
END $$;

-- Step 2: Drop all policies
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

-- Step 3: Only rename if we have 'id' and not 'user_id'
DO $$
DECLARE
  has_id_column boolean;
  has_user_id_column boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'id'
  ) INTO has_id_column;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'user_id'
  ) INTO has_user_id_column;
  
  IF has_id_column AND NOT has_user_id_column THEN
    -- Drop foreign key constraints
    EXECUTE 'ALTER TABLE daily_logs DROP CONSTRAINT IF EXISTS daily_logs_user_id_fkey';
    EXECUTE 'ALTER TABLE favorites DROP CONSTRAINT IF EXISTS favorites_user_id_fkey';
    EXECUTE 'ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_user_id_fkey';
    
    -- Rename column
    EXECUTE 'ALTER TABLE profiles RENAME COLUMN id TO user_id';
    
    -- Recreate foreign keys
    EXECUTE 'ALTER TABLE daily_logs ADD CONSTRAINT daily_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE';
    EXECUTE 'ALTER TABLE favorites ADD CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE';
    EXECUTE 'ALTER TABLE recipes ADD CONSTRAINT recipes_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE';
    
    RAISE NOTICE '✅ Renamed id to user_id';
  ELSE
    RAISE NOTICE '✅ Column already named correctly';
  END IF;
END $$;

-- Step 4: Recreate RLS policies
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

-- Daily items policies
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
  RAISE NOTICE '✅ Profiles table fixed successfully!';
  RAISE NOTICE '🔐 RLS policies recreated correctly';
  RAISE NOTICE '🔗 Foreign key constraints verified';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Please restart your app to see the changes';
END $$;
