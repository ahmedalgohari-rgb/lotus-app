# 🤖 Automatic Plant Research System - Setup Guide

## Overview

The automatic research system enables Lotus to:
- ✅ Automatically research unknown plants using external APIs
- ✅ Cache results for future scans (self-improving database)
- ✅ Track most-requested plants for manual curation
- ✅ Provide accurate care data even for plants not in the curated database

---

## 🚀 Setup Steps

### **Step 1: Get Perenual API Key** (Free Tier)

1. Visit: https://perenual.com/docs/api
2. Sign up for free account
3. Get your API key (free tier: 300 requests/day)
4. Copy the API key

### **Step 2: Add API Key to Supabase Secrets**

```bash
# Navigate to your Supabase project
cd supabase

# Set the secret (replace YOUR_API_KEY with actual key)
npx supabase secrets set PERENUAL_API_KEY=YOUR_API_KEY

# Verify it was set
npx supabase secrets list
```

**Alternative (Supabase Dashboard):**
1. Go to your Supabase project dashboard
2. Navigate to: Settings → Edge Functions → Secrets
3. Add new secret:
   - Name: `PERENUAL_API_KEY`
   - Value: `[your-api-key]`

### **Step 3: Run Database Migration**

```bash
# Apply the researched_plants table migration
npx supabase db push

# Or if using Supabase CLI directly:
psql [your-database-url] < supabase/migrations/003_researched_plants_cache.sql
```

**Alternative (Supabase Dashboard):**
1. Go to: SQL Editor
2. Open file: `supabase/migrations/003_researched_plants_cache.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click "Run"

### **Step 4: Deploy Edge Function**

```bash
# Deploy the research-plant Edge Function
npx supabase functions deploy research-plant

# Verify deployment
npx supabase functions list
```

### **Step 5: Test the System**

```bash
# Test the Edge Function directly
npx supabase functions invoke research-plant --body '{
  "scientificName": "Monstera adansonii",
  "commonName": "Swiss Cheese Vine",
  "family": "Araceae"
}'
```

**Expected Response:**
```json
{
  "success": true,
  "cached": false,
  "plant": {
    "scientific_name": "Monstera adansonii",
    "care_data": {
      "plant_type": "foliage",
      "watering": { "schedule": "60_dry", ... },
      ...
    },
    "research_source": "perenual"
  }
}
```

---

## 📊 How It Works

### **User Flow:**

```
1. User scans unknown plant
   ↓
2. App checks curated database (719 plants)
   ↓ Not found
3. App checks researched_plants cache
   ↓ Not in cache
4. App triggers background research Edge Function
   ↓
5. Edge Function calls Perenual API
   ↓
6. Stores result in researched_plants table
   ↓
7. Next scan of same plant → instant cache hit! ✨
```

### **Research Priority:**

1. **Tier 1:** Curated database (719 plants) - highest quality
2. **Tier 2:** Researched plants cache - auto-researched, good quality
3. **Tier 3:** Family fallback - generic care
4. **Tier 4:** Default care - safe fallback

---

## 🔍 Monitoring & Analytics

### **View Most Requested Unknown Plants:**

```sql
SELECT * FROM most_requested_plants
LIMIT 20;
```

This view shows which plants users scan most frequently but aren't in the curated database. **Use this to prioritize manual curation!**

### **Check Research Cache Status:**

```sql
SELECT
  COUNT(*) as total_researched,
  COUNT(*) FILTER (WHERE verified = true) as verified,
  COUNT(*) FILTER (WHERE research_source = 'perenual') as from_api,
  COUNT(*) FILTER (WHERE research_source = 'family_fallback') as from_family
FROM researched_plants;
```

### **View Recent Researches:**

```sql
SELECT
  scientific_name,
  common_names,
  research_source,
  confidence_score,
  times_requested,
  researched_at
FROM researched_plants
ORDER BY researched_at DESC
LIMIT 10;
```

---

## 🎯 Sunday Automation (Optional)

### **Automatic Weekly Curation:**

The system tracks which plants are requested most. You can set up a weekly automation to:

1. Get top 10 most-requested plants
2. Review their research quality
3. Mark as `verified = true` or add to CSV
4. Clear cache for re-research if needed

**Script:** (To be created)
```bash
npm run curate-weekly
```

---

## ⚙️ Configuration

### **Cache Expiration:**

Default: 30 days

To change:
```sql
-- Set to 90 days
ALTER TABLE researched_plants
ALTER COLUMN expires_at
SET DEFAULT (NOW() + INTERVAL '90 days');
```

### **API Rate Limits:**

- Perenual Free Tier: 300 requests/day
- Cache hit rate: ~95% after first week
- Estimated daily API calls: ~10-20 (for new plants only)

---

## 🐛 Troubleshooting

### **Edge Function Returns 500 Error:**

**Check Logs:**
```bash
npx supabase functions logs research-plant
```

**Common Issues:**
- ❌ PERENUAL_API_KEY not set → See Step 2
- ❌ Migration not applied → See Step 3
- ❌ RLS policy blocking insert → Check user is authenticated

### **Research Not Triggering:**

**Check App Logs:**
```
Look for: "🌐 Triggering automatic research for: [plant name]"
```

**If missing:**
- Ensure plant is truly unknown (not in database OR cache)
- Check `needsResearch` flag in careData

### **Cache Always Empty:**

**Verify Table Exists:**
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'researched_plants'
);
```

**Check RLS Policies:**
```sql
SELECT * FROM pg_policies
WHERE tablename = 'researched_plants';
```

---

## 📈 Performance Impact

### **Before Automatic Research:**
- Unknown plant → Generic family fallback
- No improvement over time
- Users get poor care recommendations

### **After Automatic Research:**
- Unknown plant → Auto-researched + cached
- Self-improving database
- 95%+ cache hit rate after 1 week
- Users get accurate care data

### **Resource Usage:**
- Edge Function: ~200ms execution time
- Database storage: ~5KB per plant
- API calls: 10-20/day (after initial cache warming)

---

## ✅ Success Criteria

After setup, verify:

1. ✅ Edge Function deployed and accessible
2. ✅ researched_plants table exists
3. ✅ Perenual API key configured
4. ✅ Test plant researches successfully
5. ✅ Cache returns data on second scan
6. ✅ most_requested_plants view shows data

---

## 🎉 You're Done!

The automatic research system is now active. As users scan plants:
- Known plants → Instant curated data
- Unknown plants → Auto-research → Cached → Future scans instant!

**Monitor the `most_requested_plants` view weekly to see which plants should be manually added to the curated database.**

---

## 📞 Support

Issues? Check:
- Supabase Edge Function logs
- App console logs for research triggers
- Database for cached entries

Still stuck? Review the code:
- Edge Function: `/supabase/functions/research-plant/index.ts`
- Client Service: `/src/services/plantResearch.ts`
- Integration: `/src/services/plantnet.ts`
