# 🔒 SECURITY DEPLOYMENT GUIDE

Complete step-by-step guide to deploying the secure infrastructure for Lotus app.

---

## 📋 PREREQUISITES

Before starting, ensure you have:
- [x] Supabase project created
- [x] Supabase CLI installed (`npm install -g supabase`)
- [x] PlantNet API key
- [x] OpenWeather API key
- [x] Git repository access

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Install Supabase CLI

```bash
# Install globally
npm install -g supabase

# Verify installation
supabase --version
```

### Step 2: Login to Supabase

```bash
# Login (opens browser)
supabase login

# You'll be redirected to Supabase to authenticate
```

### Step 3: Link to Your Project

```bash
# Navigate to project directory
cd /Users/ahmedalgohari/Lotus

# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Find YOUR_PROJECT_REF in Supabase Dashboard:
# Settings → General → Reference ID
```

### Step 4: Set Edge Function Secrets

```bash
# Set PlantNet API key (SECURE - not exposed to client)
supabase secrets set PLANTNET_API_KEY=your_plantnet_key_here

# Set OpenWeather API key (SECURE - not exposed to client)
supabase secrets set OPENWEATHER_API_KEY=your_openweather_key_here

# Verify secrets are set
supabase secrets list

# Output should show:
# PLANTNET_API_KEY (hidden)
# OPENWEATHER_API_KEY (hidden)
```

### Step 5: Deploy Database Migrations

```bash
# Run migrations to create tables and enable RLS
supabase db push

# This will:
# ✅ Create api_usage table for rate limiting
# ✅ Enable Row-Level Security on all tables
# ✅ Create security policies

# Verify in Supabase Dashboard:
# Database → Tables → plants → "RLS enabled" should be ON
```

### Step 6: Deploy Edge Functions

```bash
# Deploy PlantNet identification function
supabase functions deploy identify-plant

# Deploy Weather function
supabase functions deploy get-weather

# Verify deployment
supabase functions list

# Output should show:
# identify-plant (deployed)
# get-weather (deployed)
```

### Step 7: Test Edge Functions

```bash
# Test PlantNet function (requires auth token)
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/identify-plant' \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"imageUri": "https://example.com/plant.jpg", "organ": "leaf", "language": "en"}'

# Test Weather function (no auth needed)
curl 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/get-weather?lang=en'

# If both return data, deployment successful!
```

### Step 8: Update Local .env File

```bash
# Your .env should ONLY have these PUBLIC variables:
cat > .env << 'EOF'
# ✅ SAFE: These are meant to be public (for Supabase RLS)
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 🔒 REMOVED: API keys no longer exposed in client
# EXPO_PUBLIC_PLANTNET_API_KEY - DELETED (now in Edge Function)
# EXPO_PUBLIC_OPENWEATHER_API_KEY - DELETED (now in Edge Function)

# Optional: Debug mode
EXPO_PUBLIC_DEBUG_PLANTNET=false
EOF
```

### Step 9: Rebuild Your App

```bash
# Clear build cache
rm -rf node_modules/.cache

# Reinstall dependencies
npm install

# Test in development
npx expo start

# Build production bundle
npx expo export

# Verify NO API keys in bundle
grep -r "PLANTNET_API_KEY" dist/  # Should return NOTHING
grep -r "OPENWEATHER_API_KEY" dist/  # Should return NOTHING
```

### Step 10: Verify Security

**Test 1: Check for exposed keys**
```bash
# Export app bundle
npx expo export

# Search for sensitive keys (should find NOTHING)
grep -r "plantnet" dist/ --ignore-case
grep -r "openweather" dist/ --ignore-case

# ✅ PASS: No results
# ❌ FAIL: If you find API keys, they're still exposed!
```

**Test 2: Test rate limiting**
```javascript
// In your app, try making 11 plant identifications rapidly
// The 11th should fail with "Rate limit exceeded"
// This proves rate limiting is working
```

**Test 3: Test RLS (Row-Level Security)**
```sql
-- In Supabase SQL Editor, try to access another user's data:
SELECT * FROM plants WHERE user_id != auth.uid();

-- ✅ PASS: Returns empty (RLS blocks access)
-- ❌ FAIL: Returns data (RLS not working!)
```

---

## 🔍 TROUBLESHOOTING

### Problem: Edge Function fails with "API key not configured"

**Solution:**
```bash
# Re-set secrets
supabase secrets set PLANTNET_API_KEY=your_key
supabase secrets set OPENWEATHER_API_KEY=your_key

# Redeploy functions
supabase functions deploy identify-plant
supabase functions deploy get-weather
```

### Problem: "Rate limit exceeded" even on first request

**Solution:**
```sql
-- Clear rate limiting table
DELETE FROM api_usage WHERE user_id = 'your_user_id';
```

### Problem: App still shows "EXPO_PUBLIC_PLANTNET_API_KEY"

**Solution:**
```bash
# Remove from .env
rm .env
# Recreate with only SUPABASE vars
cat > .env << 'EOF'
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EOF

# Rebuild
rm -rf node_modules/.cache
npx expo start --clear
```

### Problem: "Unauthorized" when calling Edge Function

**Solution:**
```javascript
// Ensure user is authenticated before calling
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  // User needs to log in first
  // Edge Functions require authentication
}
```

---

## ✅ POST-DEPLOYMENT CHECKLIST

Before going to production, verify:

### Security
- [ ] No `EXPO_PUBLIC_PLANTNET_API_KEY` in code
- [ ] No `EXPO_PUBLIC_OPENWEATHER_API_KEY` in code
- [ ] No API keys visible in app bundle (`npx expo export` + grep)
- [ ] Edge Functions deployed and responding
- [ ] Secrets set in Supabase Dashboard
- [ ] RLS enabled on all tables (plants, care_events, profiles, api_usage)
- [ ] RLS policies tested (can't access other users' data)

### Functionality
- [ ] Plant identification works via Edge Function
- [ ] Weather data loads via Edge Function
- [ ] Rate limiting works (11th request fails)
- [ ] Auth required for plant identification
- [ ] No auth required for weather (public data)
- [ ] Error messages don't leak sensitive info

### Performance
- [ ] Edge Functions respond in <3 seconds
- [ ] Weather cached for 6 hours
- [ ] No unnecessary API calls
- [ ] App works offline (cached data)

### Monitoring
- [ ] Set up Supabase Edge Function logs
- [ ] Monitor `api_usage` table for abuse
- [ ] Set up alerts for high API usage
- [ ] Review Edge Function error logs weekly

---

## 📊 COST MONITORING

### Expected Costs (Free Tier)

| Service | Free Tier | Expected Usage | Cost |
|---------|-----------|----------------|------|
| Supabase | 500MB DB, 2GB storage | < 100MB | $0 |
| Edge Functions | 500K invocations/month | ~10K/month | $0 |
| PlantNet API | 500 requests/day | ~100/day | $0 |
| OpenWeather API | 1000 requests/day | ~50/day | $0 |
| **TOTAL** | | | **$0/month** |

### Cost Alerts

Set up billing alerts:
1. Supabase: Settings → Billing → Usage Alerts
2. PlantNet: Dashboard → Usage Monitoring
3. OpenWeather: API Keys → Usage Statistics

**Recommended limits:**
- PlantNet: Alert at 400 requests/day (80% of free tier)
- OpenWeather: Alert at 800 requests/day (80% of free tier)
- Supabase: Alert at 400MB database (80% of free tier)

---

## 🆘 EMERGENCY PROCEDURES

### If API Key is Compromised

```bash
# 1. Immediately rotate the key
# Go to PlantNet/OpenWeather dashboard and generate new key

# 2. Update Supabase secret
supabase secrets set PLANTNET_API_KEY=new_key_here

# 3. Redeploy Edge Function
supabase functions deploy identify-plant

# 4. Revoke old key in provider dashboard

# 5. Monitor usage for next 24 hours
```

### If Under DDoS Attack

```bash
# 1. Enable stricter rate limiting
# Update Edge Function to 5 requests/hour instead of 10

# 2. Temporarily disable public access
# Require authentication for weather endpoint

# 3. Check api_usage table for abuse
SELECT user_id, COUNT(*) as requests
FROM api_usage
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id
ORDER BY requests DESC;

# 4. Ban abusive users
# Block their user_id in Edge Function
```

### If RLS Breach Suspected

```sql
-- 1. Immediately re-enable RLS if disabled
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Verify policies exist
SELECT tablename, policyname FROM pg_policies
WHERE schemaname = 'public';

-- 3. Check for unauthorized access in logs
-- Supabase Dashboard → Database → Logs

-- 4. Reset all user sessions (if breach confirmed)
-- This forces re-authentication
```

---

## 📞 SUPPORT

If you encounter issues:

1. **Supabase Issues:** https://supabase.com/docs
2. **Edge Functions:** https://supabase.com/docs/guides/functions
3. **PlantNet API:** support@plantnet.org
4. **OpenWeather API:** https://openweathermap.org/faq

---

## 🎯 NEXT STEPS

After successful deployment:

1. Monitor usage for 1 week
2. Review Edge Function logs daily
3. Test on multiple devices
4. Set up automated backups
5. Create disaster recovery plan
6. Schedule quarterly security audits

**Your app is now secure! 🔒**

---

**Remember:** Security is ongoing. Review this guide every 3 months and update as needed.
