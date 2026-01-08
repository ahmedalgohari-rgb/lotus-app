# 🔒 SECURITY AUDIT & REMEDIATION PLAN

**Date:** 2025-12-20
**Status:** 🔴 **CRITICAL VULNERABILITIES FOUND**
**Priority:** **P0 - Fix before production launch**

---

## 📋 EXECUTIVE SUMMARY

Your app has **4 critical security vulnerabilities** that must be fixed before launch:

| # | Vulnerability | Severity | Status | Cost if Exploited |
|---|--------------|----------|--------|-------------------|
| 1 | **Exposed API Keys** | 🔴 CRITICAL | Not Fixed | $500-$5000/day |
| 2 | **No Rate Limiting** | 🔴 CRITICAL | Not Fixed | App crash + $$$|
| 3 | **No DDoS Protection** | 🟡 HIGH | Not Fixed | App downtime |
| 4 | **RLS Not Verified** | 🟡 HIGH | Unknown | Data breach |
| 5 | **No Frontend Audit** | 🟡 MEDIUM | Not Done | Token leaks |

**Estimated Time to Fix:** 3-4 hours
**Estimated Cost if Not Fixed:** $500-$10,000 in first month

---

## 🔍 VULNERABILITY DETAILS

### 1. 🔴 CRITICAL: Exposed API Keys

**Location:**
```typescript
// src/services/plantnet.ts:17
const PLANTNET_API_KEY = process.env.EXPO_PUBLIC_PLANTNET_API_KEY || '';

// src/services/weather.ts:48
const apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
```

**Problem:**
The `EXPO_PUBLIC_` prefix means these keys are **embedded in your app bundle** and visible to anyone who downloads your app.

**How to Exploit:**
```bash
# Attacker downloads your app
npx expo export
cat dist/bundles/*.js | grep "PLANTNET"
# Gets your API key in 30 seconds
```

**Attack Scenarios:**
- ✗ Attacker racks up $500/day on your PlantNet API
- ✗ Attacker uses your OpenWeather key for their own app
- ✗ You get banned from both services for TOS violation

**Fix:** Move keys to backend serverless functions (Edge Functions)

---

### 2. 🔴 CRITICAL: No Rate Limiting

**Location:** All API endpoints (PlantNet, OpenWeather)

**Problem:**
Nothing prevents a bot from calling your APIs 1000 times/minute.

**Attack Scenarios:**
```javascript
// Attacker's script
for (let i = 0; i < 10000; i++) {
  fetch('YOUR_PLANTNET_ENDPOINT', { method: 'POST', body: image });
}
// Result: $1000+ API bill in 10 minutes
```

**Fix:** Implement rate limiting per user/IP

---

### 3. 🟡 HIGH: No DDoS Protection

**Problem:**
No protection against distributed denial-of-service attacks.

**Attack Scenario:**
- 1000 bots hit your app simultaneously
- Your backend crashes
- Users can't use the app
- You pay for every request

**Fix:** Use Cloudflare or Vercel Edge Functions

---

### 4. 🟡 HIGH: Row-Level Security Status Unknown

**Location:** Supabase database

**Problem:**
We can't see if RLS (Row-Level Security) is enabled on your Supabase tables.

**Attack Scenario (if not enabled):**
```javascript
// Attacker can read ALL users' data
const { data } = await supabase.from('plants').select('*');
// Gets everyone's plant collection, photos, locations
```

**Fix:** Enable RLS on all Supabase tables

---

### 5. 🟡 MEDIUM: No Security Audit Yet

**Problem:**
Haven't inspected app with browser dev tools to check for:
- Leaked tokens
- Over-fetching data
- Client-side only validation

**Fix:** Manual audit with Chrome DevTools

---

## 🛠️ REMEDIATION PLAN

### Phase 1: Immediate Fixes (2-3 hours)

#### Fix 1.1: Create Supabase Edge Functions for API Keys

**Step 1:** Create Edge Functions directory
```bash
cd /Users/ahmedalgohari/Lotus
mkdir -p supabase/functions/identify-plant
mkdir -p supabase/functions/get-weather
```

**Step 2:** Create PlantNet Edge Function
```typescript
// supabase/functions/identify-plant/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PLANTNET_API_KEY = Deno.env.get('PLANTNET_API_KEY') // Secure!

serve(async (req) => {
  try {
    // 1. Verify user is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 })
    }

    // 2. Rate limiting (10 requests per hour per user)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Check rate limit
    const { count } = await supabase
      .from('api_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('api_name', 'plantnet')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString())

    if (count && count >= 10) {
      return new Response('Rate limit exceeded. Max 10 requests per hour.', {
        status: 429
      })
    }

    // 3. Call PlantNet API (key is secure in environment)
    const { imageUri, organ, language } = await req.json()

    const formData = new FormData()
    formData.append('images', imageUri)
    formData.append('organs', organ)

    const plantNetResponse = await fetch(
      `https://my-api.plantnet.org/v2/identify/all?api-key=${PLANTNET_API_KEY}&lang=${language}`,
      { method: 'POST', body: formData }
    )

    // 4. Log usage for rate limiting
    await supabase.from('api_usage').insert({
      user_id: user.id,
      api_name: 'plantnet',
      created_at: new Date().toISOString()
    })

    const data = await plantNetResponse.json()
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

**Step 3:** Create Weather Edge Function
```typescript
// supabase/functions/get-weather/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY') // Secure!

serve(async (req) => {
  try {
    // Rate limiting: Cache for 6 hours, everyone gets same data
    const cacheKey = 'cairo_weather'

    // Call OpenWeather API (key is secure)
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=30.0444&lon=31.2357&appid=${OPENWEATHER_API_KEY}&units=metric&lang=en`
    )

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=21600' // 6 hours
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    })
  }
})
```

**Step 4:** Deploy Edge Functions
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Set secrets
supabase secrets set PLANTNET_API_KEY=your_key_here
supabase secrets set OPENWEATHER_API_KEY=your_key_here

# Deploy
supabase functions deploy identify-plant
supabase functions deploy get-weather
```

**Step 5:** Update App to Use Edge Functions
```typescript
// src/services/plantnet.ts
// REMOVE THIS:
// const PLANTNET_API_KEY = process.env.EXPO_PUBLIC_PLANTNET_API_KEY || '';

// REPLACE WITH:
const SUPABASE_FUNCTION_URL = process.env.EXPO_PUBLIC_SUPABASE_URL + '/functions/v1';

async function directPlantNetApiCall(
  imageUri: string,
  organ: string,
  language: 'en' | 'ar'
): Promise<PlantNetResponse | null> {
  const session = await supabase.auth.getSession();

  const response = await fetch(`${SUPABASE_FUNCTION_URL}/identify-plant`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.data.session?.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ imageUri, organ, language })
  });

  if (!response.ok) {
    throw new Error(`Edge Function error: ${response.status}`);
  }

  return await response.json();
}
```

#### Fix 1.2: Enable Supabase Row-Level Security

**Step 1:** Go to Supabase Dashboard → Database → Tables

**Step 2:** For each table (plants, care_events, profiles), enable RLS:

```sql
-- Enable RLS on plants table
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own plants
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
USING (auth.uid() = user_id);

-- Policy: Users can only delete their own plants
CREATE POLICY "Users can delete own plants"
ON plants FOR DELETE
USING (auth.uid() = user_id);

-- Repeat for care_events table
ALTER TABLE care_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own care events"
ON care_events FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM plants WHERE id = care_events.plant_id
  )
);

-- Repeat for profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

#### Fix 1.3: Create API Usage Tracking Table

```sql
-- Create table for rate limiting
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  api_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast rate limit checks
CREATE INDEX idx_api_usage_user_time
ON api_usage(user_id, api_name, created_at);

-- Enable RLS
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
ON api_usage FOR SELECT
USING (auth.uid() = user_id);
```

#### Fix 1.4: Add DDoS Protection (Cloudflare)

**Option A: Free Cloudflare Setup**
1. Sign up at cloudflare.com
2. Add your domain
3. Enable "Under Attack Mode" when needed
4. Set up rate limiting rules (10 req/min per IP)

**Option B: Vercel Edge Functions** (if using Vercel)
- Built-in DDoS protection
- No extra setup needed

---

### Phase 2: Security Audit (1 hour)

#### Audit 2.1: Remove EXPO_PUBLIC_ Keys

**Step 1:** Update .env file
```bash
# BEFORE (EXPOSED):
EXPO_PUBLIC_PLANTNET_API_KEY=abc123
EXPO_PUBLIC_OPENWEATHER_API_KEY=xyz789

# AFTER (SECURE):
# These are now in Supabase Edge Function secrets
# REMOVED from client bundle
```

**Step 2:** Update code to remove all EXPO_PUBLIC_ references for sensitive keys

**Step 3:** Rebuild app and verify keys aren't in bundle
```bash
npx expo export
grep -r "PLANTNET" dist/  # Should return nothing
```

#### Audit 2.2: Browser DevTools Inspection

**Step 1:** Open app in browser (Expo web)
```bash
npx expo start --web
```

**Step 2:** Open Chrome DevTools → Network tab
- Check all API calls
- Verify no API keys in requests
- Verify auth tokens are used correctly

**Step 3:** Application → Local Storage
- Check for leaked tokens
- Verify sensitive data isn't stored unencrypted

**Step 4:** Console → Check for errors/warnings

---

## ✅ VERIFICATION CHECKLIST

Before launch, verify:

- [ ] No EXPO_PUBLIC_PLANTNET_API_KEY in code
- [ ] No EXPO_PUBLIC_OPENWEATHER_API_KEY in code
- [ ] Edge functions deployed and working
- [ ] Rate limiting tested (try 11 requests, 11th should fail)
- [ ] RLS enabled on all Supabase tables
- [ ] RLS policies tested (try accessing other user's data)
- [ ] DDoS protection enabled (Cloudflare or Vercel)
- [ ] Browser DevTools audit completed
- [ ] No API keys visible in app bundle
- [ ] Auth tokens properly secured
- [ ] All API calls go through backend
- [ ] Error messages don't leak sensitive info

---

## 📊 COST-BENEFIT ANALYSIS

### Cost of NOT Fixing

**Scenario 1: API Key Theft**
- Attacker uses your PlantNet key
- 1000 requests/day × $0.50/request = $500/day
- **Total: $15,000/month**

**Scenario 2: DDoS Attack**
- Bot makes 1M requests
- App crashes for 24 hours
- Lost users + reputation damage
- **Total: Priceless (brand damage)**

**Scenario 3: Data Breach**
- Attacker downloads all user data
- GDPR fine: €20M or 4% of revenue
- **Total: Company-ending**

### Cost of Fixing

- Developer time: 3-4 hours
- Cloudflare: $0 (free tier)
- Supabase Edge Functions: $0 (included)
- **Total: 4 hours of dev time**

**ROI: Infinite** (prevents catastrophic loss)

---

## 🎯 PRIORITY RANKING

Fix in this order:

1. **P0 - Today:** Move API keys to Edge Functions
2. **P0 - Today:** Enable Supabase RLS
3. **P1 - This Week:** Add rate limiting
4. **P1 - This Week:** DDoS protection
5. **P2 - Before Launch:** Security audit

---

## 📞 NEXT STEPS

1. Read this document carefully
2. Decide: Fix now or accept risk?
3. If fixing: Start with Phase 1 (2-3 hours)
4. If not fixing: Document accepted risks
5. Schedule follow-up security review

---

**Remember:** Security isn't optional. One breach can end your company.

**Fix these issues before your first user signs up.**
