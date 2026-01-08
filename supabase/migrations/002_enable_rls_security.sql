-- COMPREHENSIVE ROW-LEVEL SECURITY SETUP
-- This ensures users can ONLY access their own data

-- ==========================================
-- PLANTS TABLE
-- ==========================================

-- Enable RLS on plants table
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (idempotent)
DROP POLICY IF EXISTS "Users can view own plants" ON plants;
DROP POLICY IF EXISTS "Users can insert own plants" ON plants;
DROP POLICY IF EXISTS "Users can update own plants" ON plants;
DROP POLICY IF EXISTS "Users can delete own plants" ON plants;

-- Policy: Users can only view their own plants
CREATE POLICY "Users can view own plants"
ON plants FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can only insert their own plants
CREATE POLICY "Users can insert own plants"
ON plants FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own plants
CREATE POLICY "Users can update own plants"
ON plants FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own plants
CREATE POLICY "Users can delete own plants"
ON plants FOR DELETE
USING (auth.uid() = user_id);

-- ==========================================
-- CARE_EVENTS TABLE
-- ==========================================

-- Enable RLS on care_events table
ALTER TABLE care_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own care events" ON care_events;
DROP POLICY IF EXISTS "Users can insert own care events" ON care_events;
DROP POLICY IF EXISTS "Users can update own care events" ON care_events;
DROP POLICY IF EXISTS "Users can delete own care events" ON care_events;

-- Policy: Users can only view care events for their own plants
CREATE POLICY "Users can view own care events"
ON care_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM plants
    WHERE plants.id = care_events.plant_id
    AND plants.user_id = auth.uid()
  )
);

-- Policy: Users can only insert care events for their own plants
CREATE POLICY "Users can insert own care events"
ON care_events FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM plants
    WHERE plants.id = care_events.plant_id
    AND plants.user_id = auth.uid()
  )
);

-- Policy: Users can only update care events for their own plants
CREATE POLICY "Users can update own care events"
ON care_events FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM plants
    WHERE plants.id = care_events.plant_id
    AND plants.user_id = auth.uid()
  )
);

-- Policy: Users can only delete care events for their own plants
CREATE POLICY "Users can delete own care events"
ON care_events FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM plants
    WHERE plants.id = care_events.plant_id
    AND plants.user_id = auth.uid()
  )
);

-- ==========================================
-- PROFILES TABLE
-- ==========================================

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

-- Policy: Users can only view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy: Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Users can delete their own profile
CREATE POLICY "Users can delete own profile"
ON profiles FOR DELETE
USING (auth.uid() = id);

-- ==========================================
-- PLANT_SPECIES TABLE (PUBLIC DATA)
-- ==========================================
-- Note: This table doesn't exist in current schema - skipping

-- ==========================================
-- VERIFICATION & DOCUMENTATION
-- ==========================================

-- Add comments for documentation
COMMENT ON TABLE plants IS 'User plant collections - RLS enabled, users can only access own plants';
COMMENT ON TABLE care_events IS 'Plant care history - RLS enabled, users can only access events for own plants';
COMMENT ON TABLE profiles IS 'User profiles - RLS enabled, users can only access own profile';

-- Verify RLS is enabled (run this to check)
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('plants', 'care_events', 'profiles', 'api_usage');
