-- ============================================
-- FIX DUPLICATE PROFILES - FIXED VERSION
-- ============================================

-- 1. Check current state
SELECT id, email, name, created_at, ctid
FROM profiles
WHERE id = '37701a98-ebe4-4131-b640-8f6a5752701c'
ORDER BY created_at;

-- 2. Delete duplicates, keeping ONLY the oldest entry
DELETE FROM profiles
WHERE ctid IN (
  SELECT ctid
  FROM (
    SELECT ctid, 
           ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at ASC) as rn
    FROM profiles
    WHERE id = '37701a98-ebe4-4131-b640-8f6a5752701c'
  ) t
  WHERE rn > 1
);

-- 3. Verify the fix - should return exactly 1 row
SELECT id, email, name, created_at
FROM profiles
WHERE id = '37701a98-ebe4-4131-b640-8f6a5752701c';

-- 4. Check for any other duplicates
SELECT id, COUNT(*) as count
FROM profiles
GROUP BY id
HAVING COUNT(*) > 1;

-- ✅ If the last query returns no rows, you're good!

DO $$
BEGIN
  RAISE NOTICE '✅ Duplicate profiles removed!';
  RAISE NOTICE 'Each user now has exactly one profile';
END $$;
