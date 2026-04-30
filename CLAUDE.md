# Lotus - Project Documentation

> Plant care app for Egypt with AI identification, Arabic support, and Cairo-specific care tips.

---

## Quick Reference

### Database Commands
```bash
npm run sync-db      # CSV → JSON (ALWAYS run after CSV edits)
npm run validate-db  # Check data quality before committing
```

### Golden Rules
1. ✅ **ALWAYS edit `docs/database_complete_detailed.csv`** (single source of truth)
2. ✅ **ALWAYS run `npm run sync-db`** after CSV changes
3. ✅ **ALWAYS run `npm run validate-db`** before committing
4. ❌ **NEVER manually edit `src/data/plantCareDatabase.json`** (auto-generated)

### CSV Column Structure (22 columns)
```
Plant ID, Common Name, Scientific Name, Genus, Family, Arabic Name,
Difficulty, Type, Pet Safe, Watering, Light Req, Light Desc,
Soil, Temp Range, Humidity, Fertilizer, Plant Info EN, Plant Info AR,
Cairo Suitability, Summer Care, Winter Care, Image URL
```

---

## Architecture Overview

### Plant Identification Flow
```
📸 User takes photo
       ↓
🌿 PlantNet Edge Function (secure, rate-limited)
       ↓
📚 Match against local database (~720 curated plants)
       ↓
🔍 If not found → Research Service (Perenual API)
       ↓
✅ Show results with care info
```

### Security Model
- **API Keys**: Stored as Supabase secrets (not in app bundle)
- **Rate Limiting**: Live-tunable via `api_config` table (default: 30/hr per user, 400/day global)
- **RLS**: Users can only access their own plants
- **Edge Functions**: `/supabase/functions/identify-plant/`, `/supabase/functions/get-weather-apple/`

### Live API Governance (`api_config` + `api_usage_buckets`)
- **Knobs**: Edit rows in `api_config` table to change rate limits, pause APIs, or set daily caps — **no Edge Function redeploy needed**
- **Kill switch**: `UPDATE api_config SET enabled = FALSE WHERE api_name = 'plantnet'` → clients get 503 immediately (effective within 60s due to module-scope cache TTL)
- **Per-user limit**: `rate_limit_per_hour` (per user, sliding fixed-window by hour)
- **Global circuit breaker**: `max_calls_per_day` — total across all users; protects against runaway usage / hitting PlantNet's free-tier 500/day ceiling
- **Counter pattern**: `api_usage_buckets` stores one row per `(api_name, user_id, hour_bucket)` via UPSERT — replaces per-event logging in old `api_usage` table (~30x fewer rows)
- **Aggregation helpers** (SECURITY DEFINER, bypass RLS): `increment_api_usage_bucket(api, hour)`, `get_api_global_daily_count(api)`
- **Alerts** (optional, requires pg_cron): `check_api_thresholds()` writes to `api_alerts` when usage ≥80% of daily cap. Schedule with `cron.schedule('check_api_thresholds', '*/15 * * * *', ...)`
- **Migrations**: `supabase/migrations/005_api_config_and_buckets.sql`, `006_api_alerts.sql`

### Database Sync Pipeline
- **Source of Truth**: `docs/database_complete_detailed.csv`
- **Runtime Database**: `src/data/plantCareDatabase.json` (auto-generated)
- **Sync Script**: `scripts/sync-csv-to-json.js` (parses watering, temperature, schedules)
- **Validation**: `scripts/validate-database.js` (genus matching, required fields, format checks)

---

## Core Features

### Plant Detection (PlantNet Integration)
- **Confidence Threshold**: 15% minimum (industry standard for plant ID)
- **Display Logic**: Prefer database names over PlantNet's when match found
- **Match Tiers**: Exact (95%), Genus (80%), Common name (60-100%)

### Research Service (Unknown Plants)
- **Purpose**: Provide care info for plants not in our 135-plant curated database
- **Flow**: PlantNet identifies species → Not in database → Research via Edge Function
- **Edge Function**: `supabase/functions/research-plant/index.ts`
- **Data Source**: Perenual API for plant care information
- **Caching**: Results stored in `researched_plants` table with expiration
- **Service**: `src/services/plantResearch.ts`
  - `researchPlant()` - Research unknown plant via Edge Function
  - `getResearchedPlant()` - Check cache first
  - `getMostRequestedPlants()` - For prioritizing manual curation
  - `researchedPlantToIdentificationResult()` - Convert to app format

### Guest Mode & Authentication
- **Guest Capabilities**: Unlimited scanning, view AI results with plant info
- **Requires Auth**: Save to collection, track watering, care schedules
- **Trigger**: Auth modal appears when tapping "Add to My Plants"
- **Philosophy**: "Aha moment" UX - experience core value before signup

### Seasonal Care System
- **Cairo Climate**: Summer (Jun-Sep), Winter (Dec-Feb), Spring/Fall (Mar-May, Oct-Nov)
- **Auto-Update**: Care recommendations recalculate when season changes
- **Storage**: Season state in AsyncStorage, compared on app mount

### Localization (Arabic/English)
- **RTL Support**: Dynamic text alignment based on language
- **Egyptian Arabic**: Preferred wording (e.g., "قصة نباتك" not "قصة نبتتك")
- **Content Selection**: Code checks `getCurrentLanguage()` and uses `plant_info_arabic` when Arabic

---

## UI/UX Patterns

### PlantCard Component
- Fixed height for uniform card sizes
- Common name wraps to 2 lines max
- Taxonomic styling: genus **bold**, species *italic*

### ScanScreen (Camera)
- **Golden Ratio**: Instruction text at 62% from top (φ = 1.618)
- **Fibonacci Spacing**: Consistent gaps (13, 21, 34, 55, 89px)
- **iPhone Camera Pattern**: 100x100px capture button at thumb zone (80% from top)
- **Frame**: 260x260px with green corner brackets

### Safe Area Handling
- `useSafeAreaInsets()` for device-specific home indicator
- Dynamic padding: `Math.max(insets.bottom, 8)`

---

## Code Quality

### Standards
- Run `code-simplifier` agent after significant changes
- Catch unused imports, dead code, type issues before commit
- Avoid over-engineering - only make requested changes

### Session Verification
- Validate Supabase session before database operations
- Auto-refresh expired sessions
- Fallback to auth modal if refresh fails

---

## Key Learnings (Historical)

### Session: April 13-14, 2026 - Native WeatherKit + TestFlight Pipeline

**Native WeatherKit (Option B - On-Device):**
- Replaced Supabase Edge Function weather with native Apple WeatherKit + CoreLocation
- Module: `modules/lotus-weather/` (Expo Modules API, Swift-first)
- CLLocationManager MUST be created on main thread (`DispatchQueue.main.async`) or delegate callbacks never fire
- Fallback chain: Native WeatherKit (10s timeout) → Edge Function (Cairo) → Cache → Mock seasonal
- WeatherKit capability must be enabled in Apple Developer Portal for `com.lotus.plantcare`
- After enabling WeatherKit in portal, toggle auto-signing off/on in Xcode to regenerate provisioning profile

**Config Plugins (survive `prebuild --clean`):**
- `plugins/withWeatherKit.js` — adds WeatherKit entitlement + `NSLocationWhenInUseUsageDescription`
- `plugins/withFmtFix.js` — fixes fmt library C++17 build error on Xcode 16+ (was previously lost on every prebuild)
- Expo local modules need BOTH `expo-module.config.json` AND `package.json` to be discovered by autolinking

**TestFlight Pipeline (Local Xcode):**
1. `npx expo prebuild --clean` (press Y)
2. `open ios/Lotus.xcworkspace`
3. Xcode: Lotus target → General → verify Version + bump Build number
4. Product → Clean Build Folder (Shift+Cmd+K)
5. Select "Any iOS Device (arm64)"
6. Product → Archive → Validate App → Distribute App → App Store Connect → Upload

**Critical Versioning Rules:**
- `prebuild --clean` resets Version and Build from `app.json` — ALWAYS verify in Xcode after prebuild
- Once a version is released (e.g., 1.0.0), Apple closes that "train" — must increment to 1.1.0+
- Build number must be strictly increasing (higher than last uploaded)
- Current: Version 1.1.0, Build 56 (app.json updated to 1.1.0)

### Session: April 5, 2026 - SDK 53 Downgrade & Image Loading Fix

**Build Issues Fixed:**
- Downgraded from SDK 54 to SDK 53 to fix `folly/coro/Coroutine.h` errors
- Fixed 5 files: Changed `expo-file-system/legacy` → `expo-file-system` for SDK 53 compatibility
  - Files: `supabase.ts`, `plantnet.ts`, `imageUtils.ts`, `memoryManager.ts`, `imageProcessor.ts`
- Build 48 succeeded, Build 49 deployed with UI fixes

**Image Loading (PlantImage.tsx):**
- Removed cache (`cachePolicy="none"`) to prevent corrupted cache
- 2-second timeout with automatic fallback to next source
- Semi-transparent loading overlay

**AuthScreen UX:**
- White margins fixed: `SafeAreaView edges={['left', 'right']}` - gradient now edge-to-edge
- Tighter spacing: Reduced padding/margins by 15-37% to fit on iPhone 13 mini without scrolling

**Testing Workflow (No Xcode):**
```bash
EXPO_NO_CAPABILITY_SYNC=1 eas build --platform ios --profile production --non-interactive
eas submit --platform ios --latest
```

---

### Session: March 4, 2026 - TestFlight Prep & UX Fixes

**EAS Build Fix:**
- Created `.easignore` file to exclude screenshots, docs, backups from upload
- Reduced build upload from 92MB → 50MB, fixing EPIPE upload failures
- Build 17 successfully uploaded and submitted to TestFlight

**Season Calculation (Official Astronomical Dates):**
- Changed from month-based to official dates across all files:
  - Winter: Dec 21 - Mar 20
  - Spring: Mar 21 - Jun 20
  - Summer: Jun 21 - Sep 22
  - Autumn: Sep 23 - Dec 20
- Files updated: `careMap.ts`, `store/index.ts`, `HomeScreen.tsx`, `weather.ts`

**RTL/Arabic Fixes:**
- SearchBar: Added RTL support with `flexDirection: 'row-reverse'` and `textAlign: 'right'`
- Auth tagline: Changed from awkward MSA to natural Egyptian Arabic:
  - Old: "اعتني بنباتاتك في البيت. كبر معاها بإرشادات الخبراء."
  - New: "نباتاتك في أمان معانا. رعاية سهلة ونصائح مخصصة."

**AddScanScreen Keyboard UX:**
- Added Cancel button that appears when keyboard is open
- Changed `keyboardDismissMode` to `"on-drag"` for scroll-to-dismiss
- Camera button hides when typing, replaced by Cancel

**HomeScreen Weather Display:**
- Added "Today's Avg" / "متوسط اليوم" label under temperature
- Clarifies that shown temp is daily average, not real-time

**Plant Database Status:**
- Confirmed 721 plants with 100% coverage on all location rating fields
- Weather API: Using season-only calculation (Option A), no API calls for location rating

---

### Data Architecture (Jan 2026)
- **Problem**: CSV and JSON drifted → genus extraction failed → misidentification bugs
- **Solution**: Single source of truth (CSV) with automated sync pipeline
- **Result**: ~720 plants with 100% genus coverage, automated validation

### TestFlight Issues (Feb 2026)
- **Session Expiry**: RLS policies need active Supabase session, not just Zustand user object
- **Safe Area**: Static padding breaks on devices with different home indicators
- **Localization**: Translation keys alone aren't enough - must query by language throughout code

### Project Size (Feb 2026)
- **ios/Pods/** (1.1GB): Delete locally, regenerates on EAS builds
- **dist/**, **ios/build/**: Always gitignore build artifacts
- **Database backups**: Keep 3 most recent, automate cleanup

### TestFlight Deployment (Feb 2026)
- **EAS Build Command**: `EXPO_NO_CAPABILITY_SYNC=1 eas build --platform ios --profile production`
- **Capability Sync Error**: Apple API sometimes fails - use env var to skip auto-sync
- **Submit Command**: `eas submit --platform ios --latest`
- **No Local Cleaning Needed**: EAS builds on cloud servers, not local ios/ folder

### Nested Modals Issue (Feb 2026)
- **Problem**: React Native struggles with multiple simultaneous modals
- **Solution**: Close first modal, wait 350ms, then open second modal
- **Pattern**: `onClose(); setTimeout(() => setShowSecondModal(true), 350);`
- **AccountDrawer**: FeedbackModal renders independently of drawer's shouldRender state

### PlantDetailScreen UX (Feb 2026)
- **Optimal Section Order**: Care Schedule → Quick Actions → Care Guide → Care History
- **Removed Redundancy**: "Plant Details" section duplicated info from subtitle
- **Merged Sections**: "Plant Info" + "Adjusted Care Tips" → single "Care Guide"
- **Care Guide**: Expanded by default (personalized tips are core value)
- **Spacing Fix**: Removed duplicate marginTop from scheduleCard (was 32px, should be 16px)

### Contact Us / Feedback Feature (Feb 2026)
- **Component**: `src/components/FeedbackModal.tsx`
- **Supabase Table**: `feedback` (user_id, message, app_version, device_info)
- **Styling**: Matches NameCollectionModal (gradient background, white input)
- **RLS Policies**: Authenticated users insert with their user_id, anon users insert with null

### Apple WeatherKit Migration (Mar 2026)
- **Migration**: Replaced OpenWeatherMap with Apple WeatherKit REST API
- **Edge Function**: `supabase/functions/get-weather-apple/index.ts`
- **JWT Authentication**: ES256 with Apple-specific `id` header field (`TEAM_ID.SERVICE_ID`)
- **Secrets Required** (Supabase):
  - `WEATHERKIT_TEAM_ID` - From Apple Developer Membership page
  - `WEATHERKIT_SERVICE_ID` - Services ID with WeatherKit capability
  - `WEATHERKIT_KEY_ID` - From Keys page
  - `WEATHERKIT_PRIVATE_KEY` - Base64-encoded .p8 file content
- **Data Transformations**:
  - Humidity: decimal (0-1) → percentage (0-100)
  - Wind: km/h → m/s (÷3.6)
  - 44 condition codes → 5 Lotus conditions
- **Backward Compatible**: Response matches `OpenWeatherResponse` interface
- **Rollback**: Old `get-weather` Edge Function preserved, change 1 line in `weather.ts`

---

## File Structure (Key Files)

```
src/
├── services/
│   ├── plantnet.ts          # PlantNet integration + database matching
│   ├── plantResearch.ts     # Research service for unknown plants
│   ├── plantDatabase.ts     # Local database queries
│   └── supabase.ts          # Supabase client + auth
├── data/
│   └── plantCareDatabase.json  # AUTO-GENERATED (don't edit!)
├── screens/
│   ├── ScanScreen.tsx       # Camera + capture
│   ├── PlantResultScreen.tsx # Identification results
│   ├── AddPlantScreen.tsx   # Save plant to collection
│   └── PlantDetailScreen.tsx # Plant care details
└── i18n/locales/
    ├── en.json              # English translations
    └── ar.json              # Arabic translations

docs/
└── database_complete_detailed.csv  # SOURCE OF TRUTH (edit this!)

scripts/
├── sync-csv-to-json.js      # CSV → JSON pipeline
└── validate-database.js     # Data quality checks

modules/
└── lotus-weather/           # Native WeatherKit + CoreLocation (Expo Module)
    ├── expo-module.config.json
    ├── index.ts             # TS bindings (getNativeWeather)
    ├── package.json
    └── ios/
        ├── LotusWeatherModule.swift  # Swift native module
        └── LotusWeather.podspec

plugins/
├── withAppIcon.js           # App Store icon fix
├── withWeatherKit.js        # WeatherKit entitlement + location permission
└── withFmtFix.js            # Xcode 16+ fmt build fix

supabase/functions/
├── identify-plant/          # Secure PlantNet proxy
├── get-weather-apple/       # Apple WeatherKit REST API (fallback for native)
├── get-weather/             # OpenWeatherMap API (deprecated)
└── research-plant/          # Unknown plant research
```
