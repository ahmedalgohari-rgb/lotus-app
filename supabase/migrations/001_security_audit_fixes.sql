-- Security Audit Fixes - Row-Level Security Improvements
-- Generated: 2025-11-08
-- Purpose: Fix profile privacy and add RLS to plant_species table

-- ============================================================================
-- 1. FIX PROFILES TABLE - Make profiles private
-- ============================================================================

-- Drop the overly permissive policy that allows public viewing of all profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Replace with privacy-preserving policy: users can only view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Note: Insert, Update, Delete policies for profiles are already secure ✅


-- ============================================================================
-- 2. ADD RLS TO PLANT_SPECIES TABLE (Reference Data)
-- ============================================================================

-- Enable RLS on plant_species table
ALTER TABLE plant_species ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read plant species (reference data)
CREATE POLICY "Anyone can view plant species" ON plant_species
  FOR SELECT USING (true);

-- Only allow authenticated users to insert/update/delete (for admin operations)
-- In practice, this table should be managed via migrations, not app code
CREATE POLICY "Only authenticated users can insert species" ON plant_species
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update species" ON plant_species
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can delete species" ON plant_species
  FOR DELETE USING (auth.role() = 'authenticated');


-- ============================================================================
-- 3. VERIFY EXISTING SECURE POLICIES (No changes needed)
-- ============================================================================

-- The following tables already have secure RLS policies in place:
--
-- ✅ plants table:
--    - Users can only SELECT/INSERT/UPDATE/DELETE their own plants
--    - Policy: auth.uid() = user_id
--
-- ✅ care_events table:
--    - Users can only SELECT/INSERT/UPDATE/DELETE their own care events
--    - Policy: auth.uid() = user_id
--
-- ✅ storage.objects (plant-images bucket):
--    - Public read access for plant images
--    - Authenticated users can upload
--    - Users can only UPDATE/DELETE their own images
--    - Policy: auth.uid()::text = (storage.foldername(name))[1]


-- ============================================================================
-- 4. STORAGE BUCKET VERIFICATION
-- ============================================================================

-- Verify plant-images bucket exists and is public (for image URLs to work)
-- Note: Run this separately if bucket doesn't exist:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('plant-images', 'plant-images', true)
-- ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- SECURITY AUDIT SUMMARY
-- ============================================================================

-- FIXED:
-- ✅ Profiles table: Changed from public viewing to private (users see only their own)
-- ✅ Plant species table: Added RLS with public read access for reference data
--
-- ALREADY SECURE:
-- ✅ Plants table: Proper user-scoped access control
-- ✅ Care events table: Proper user-scoped access control
-- ✅ Storage bucket: Proper user-scoped image access
--
-- RECOMMENDATIONS:
-- - Regularly audit RLS policies as new tables are added
-- - Test RLS policies with different user accounts
-- - Consider adding service role bypass for admin operations if needed
-- - Monitor Supabase logs for unauthorized access attempts
