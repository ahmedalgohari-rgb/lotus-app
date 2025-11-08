# Supabase Migrations

This directory contains SQL migration files for the Lotus app database.

## How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the migration file (`001_security_audit_fixes.sql`)
4. Copy and paste the SQL into the editor
5. Click **Run** to execute

### Option 2: Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run the migration
supabase db push
```

### Option 3: Direct SQL Execution

If you have direct database access:

```bash
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/001_security_audit_fixes.sql
```

## Migration Files

### `001_security_audit_fixes.sql`

**Purpose:** Security audit fixes for Row-Level Security (RLS)

**Changes:**
- 🔒 **Profiles table**: Changed from public viewing to private (users can only view their own profile)
- 🔒 **Plant species table**: Added RLS with public read access for reference data
- ✅ **Verified**: Plants, care_events, and storage policies are already secure

**Impact:**
- Existing users: No impact on functionality
- Security: Significantly improves user privacy
- Breaking changes: None (only enhances security)

## Testing Migrations

After applying the migration, verify the changes:

```sql
-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Check policies on profiles table
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Check policies on plant_species table
SELECT * FROM pg_policies WHERE tablename = 'plant_species';
```

## Rollback Instructions

If you need to rollback the `001_security_audit_fixes.sql` migration:

```sql
-- Restore public profile viewing (if needed)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Disable RLS on plant_species (if needed)
ALTER TABLE plant_species DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view plant species" ON plant_species;
DROP POLICY IF EXISTS "Only authenticated users can insert species" ON plant_species;
DROP POLICY IF EXISTS "Only authenticated users can update species" ON plant_species;
DROP POLICY IF EXISTS "Only authenticated users can delete species" ON plant_species;
```

## Best Practices

1. **Always backup** your database before running migrations
2. **Test migrations** in a development environment first
3. **Review SQL** carefully before executing
4. **Monitor logs** after applying migrations to catch any issues
5. **Document changes** in commit messages and this README

## Support

For questions or issues with migrations:
- Check Supabase documentation: https://supabase.com/docs/guides/database/migrations
- Review RLS policies: https://supabase.com/docs/guides/auth/row-level-security
- Open an issue in the repository
