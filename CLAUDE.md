- **Redesigned Plant Card Component:** Updated `src/components/PlantCard.tsx` to solve text truncation for long plant names.
  - Implemented a fixed card height to ensure all cards in a list have a uniform size.
  - Allowed the common name to wrap to two lines.
  - Vertically centered the text block to handle both single and double-line names elegantly.
  - Applied "Taxonomic" styling to the scientific name, making the genus bold and the species italic for improved readability and design sophistication.

- **Plant Detection Architecture (Security & ML Implementation):**
  - **Secured API Keys:** Moved PlantNet and OpenWeather API keys from client-side (EXPO_PUBLIC_*) to Supabase Edge Functions
    - Created `/supabase/functions/identify-plant/index.ts` - PlantNet API with rate limiting (10 req/hour per user)
    - Created `/supabase/functions/get-weather/index.ts` - Weather API with 24-hour caching, uses forecast API for high/low temperature averaging
    - API keys now stored as Supabase secrets (not exposed in app bundle)
  - **Database Security:** Applied Row-Level Security (RLS) on all tables
    - Migration: `001_api_usage_table.sql` - Tracks API usage for rate limiting
    - Migration: `002_enable_rls_security.sql` - Users can only access their own data
  - **Disabled Simulated Validation:** Removed mock plant detection that was using random confidence scores
    - Updated `src/services/plantnet.ts` - Removed pre-capture validation (line 227-233)
    - Updated `validateImageForCapture()` to always return true (line 172-183)
    - All photos now sent directly to PlantNet Edge Function for real AI analysis
  - **PlantNet Confidence Filtering:** Optimized threshold for real-world plant identification
    - Threshold: 15% minimum (industry standard for plant ID apps)
    - Rationale: PlantNet often returns 15-40% confidence for valid indoor plants without flowers
    - Below 15%: Rejects with "No plant detected" message
    - 15-40%: Accepts result + shows amber warning banner encouraging better photo
    - Above 40%: Accepts result without warnings
  - **Next Step - Lightweight Pre-Filter:** See `/SIMPLE_PLANT_PREFILTER_IDEAS.md` for implementation plan
    - Recommended: Color Histogram Analysis (1-2 hours, 75-80% accuracy, +10KB bundle)
    - Goal: Reject obvious non-plants (cups, pens) BEFORE calling PlantNet API
    - Stay on ScanScreen.tsx with alert feedback (no navigation)
    - Alternative: Full ML with TensorFlow Lite (8-10 days, 92%+ accuracy, +8MB bundle) - See `/Users/ahmedalgohari/.claude/plans/velvet-foraging-puffin.md`

- **ScanScreen UI/UX Redesign (Golden Harmony Implementation):**
  - **Fixed CameraView Architecture:** Resolved React Native warning by moving all overlays outside CameraView component
    - CameraView now has no children - all UI elements positioned absolutely from parent container
    - Eliminates "CameraView does not support children" warning
  - **iPhone Camera Pattern Adoption:** Applied iOS native camera app UX principles for familiar user experience
    - Capture button enlarged: 80×80px → 100×100px (25% larger)
    - Moved to thumb zone: 66% → 80% from top (ergonomic sweet spot)
    - Removed "Tap to Capture" text label (button is self-explanatory affordance)
    - Icon size increased: 32px → 36px for better visibility
  - **Golden Ratio Positioning:** Mathematical design harmony using φ (1.618) divine proportion
    - Instruction text positioned at 62% from top (golden ratio anchor: 844px ÷ 1.618 = 522px)
    - Screen division: Upper 522px (62%) : Lower 322px (38%) ≈ 1.62 ratio
    - Creates subconscious visual satisfaction through natural proportions
  - **Fibonacci Spacing System:** All vertical gaps follow Fibonacci sequence
    - Frame → Instruction: ~89px (FIBONACCI.XXXL)
    - Instruction → Capture: ~152px (18% screen height for visual balance)
    - Capture → Gallery: 55px (FIBONACCI.XXL)
    - Horizontal padding: FIBONACCI.LG (21px), FIBONACCI.MD (13px)
  - **Instruction Pill Optimization:** Reduced visual dominance for cleaner composition
    - Width reduced: 85% → 65% max-width (compact, text-fitted)
    - Font size: TYPOGRAPHY.SM (14px) with adjustsFontSizeToFit
    - Single line constraint: numberOfLines={1}
    - Background: rgba(70,70,70,0.9) with 50px border radius
  - **Frame Corner Visibility:** All 4 green brackets properly displayed and positioned
    - Frame size: 260×260px square at 20% from top
    - Corner brackets: 50×50px with 3px borders, 8px border radius
    - Green color (COLORS.primary) with smooth rounded corners
    - Complete visual guidance frame always visible in viewport
  - **Header Layout:** Back button (left), title (center), flashlight toggle (right)
    - Positioned at 50px from top
    - Semi-transparent dark backgrounds (rgba(0,0,0,0.3))
    - Flashlight icon: "flash" when enabled, "flash-outline" when disabled
  - **Gallery Button Positioning:** Bottom-left at FIBONACCI.XXL (55px) from bottom
    - Proper clearance from enlarged capture button
    - Maintains single-thumb operation zone
    - Semi-transparent background with icon + text label
  - **Result:** Mathematically harmonious UI following golden ratio and Fibonacci progression, iPhone-inspired ergonomics for muscle memory, cleaner visual hierarchy with optimized element sizing

- **Code Quality Standards:**
  - **Always Use Code Simplifier:** After completing any significant code changes (new features, refactoring, bug fixes), ALWAYS run the code-simplifier agent (`@agent-code-simplifier:code-simplifier`) to ensure code clarity, remove dead code, and maintain consistency
  - **Proactive Code Review:** Use the simplifier agent to catch unused imports, dead functions, redundant styles, and type safety issues before committing
  - **Maintenance Benefit:** Regular simplification prevents technical debt accumulation and keeps the codebase maintainable

- **Guest Mode & Authentication Flow:**
  - **Guest Mode Capabilities:** Users can scan and identify plants without authentication
    - ✅ Unlimited plant scanning (camera + gallery)
    - ✅ View AI identification results with plant info, family, and story
    - ❌ Cannot save plants to collection (requires sign up)
    - ❌ Cannot track watering history or care schedules
  - **Authentication Trigger:** Auth modal appears when user taps "Add to My Plants" button on PlantResultScreen
  - **Philosophy:** Let users experience core value (AI identification) before requesting commitment ("aha moment" UX pattern)

- **Seasonal Care Recalculation (Auto-Update System):**
  - **Detection:** App detects current season on each app open based on Cairo's climate
  - **Season Mapping:**
    - Summer: June-September (hot, dry)
    - Winter: December-February (mild, occasional rain)
    - Spring/Fall: March-May, October-November (pleasant)
  - **Auto-Recalculation:** When season changes, all saved plants' care recommendations automatically update
  - **User Notification:** Subtle alert shown: "Care tips updated for [season]" (optional)
  - **Watering Schedule Updates:**
    - Updates on each water action using seasonal care tips from careMap.ts
    - `next_watering_at` calculated based on adjusted watering interval (e.g., "12-16 days" → 16 days)
  - **Implementation:** Season state stored in AsyncStorage, compared on app mount

---

## Session: January 19, 2026 - Plant Identification Root Cause Fix & CSV→JSON Pipeline

### Overview
Fixed critical "Song of Jamaica" misidentification bug by addressing root architectural flaw: no data synchronization between CSV (source of truth) and JSON (runtime database).

### Root Cause Discovered
**The Bug:** Office plant scan returned "Corn plant" (Dracaena fragrans, 80% genus match) instead of matching to "Song of Jamaica" in database.

**The Data Issue:** CSV had `"Dracaena reflexa"` but JSON had `"Song of Jamaica"` as scientific name.

**The Architecture Flaw:** Two separate files maintained manually with no sync pipeline caused:
- Genus extraction to fail (`"Song"` instead of `"Dracaena"`)
- PlantNet results couldn't match to database by genus
- Impossible to catch data drift between files
- Manual editing errors propagated to production

### Solutions Implemented

#### 1. CSV → JSON Sync Pipeline (`scripts/sync-csv-to-json.js`)
- **Purpose:** Automated conversion from master CSV to runtime JSON
- Reads `docs/database_complete_detailed.csv` (single source of truth)
- Auto-generates `src/data/plantCareDatabase.json`
- Creates timestamped backups before every sync
- Preserves data not in CSV (aliases, extended metadata)
- **Command:** `npm run sync-db`
- **Features:**
  - Parses watering format: `"weekly: Water when top 3 inches dry"` → structured object
  - Parses temperature ranges: `"15-30°C (optimal: 22°C)"` → `{min: 15, max: 30, optimal: 22}`
  - Maps watering frequency to schedule codes (`weekly` → `60_dry`)
  - Auto-extracts genus from scientific names as fallback

#### 2. Genus Column Added to CSV
- **Migration:** CSV expanded from 21 to 22 columns
- **Position:** Genus inserted at index 3 (between Scientific Name and Family)
- **Data:** All 135 plants have explicit genus values
- **Column Order:** Plant ID, Common Name, Scientific Name, **Genus**, Family, Arabic Name, Difficulty, Type, Pet Safe, Watering, Light Req, Light Desc, Soil, Temp Range, Humidity, Fertilizer, Plant Info EN, Plant Info AR, Cairo Suitability, Summer Care, Winter Care, Image URL
- **Sync Update:** Script reads from `COL.GENUS` (index 3) with fallback to extraction
- **Rationale:** Explicit genus prevents parsing errors and supports hybrid/cultivar names

#### 3. Database Validation (`scripts/validate-database.js`)
- **Purpose:** Catches data quality issues before deployment
- **Validations:**
  - ✅ Genus matches first word of scientific name
  - ✅ All required fields present (id, names, care basics, family)
  - ✅ Scientific name format (starts with capital letter, Latin characters only)
  - ⚠️  Quality warnings (missing Arabic translations, short plant descriptions)
- **Exit Code:** Returns 1 if errors found (CI-friendly)
- **Command:** `npm run validate-db`
- **Output:** Detailed error reports with plant IDs and specific issues

#### 4. User-Friendly Plant Names
Updated 11 plants with friendly common names while keeping botanical names searchable:
- `crassula_perforata`: "String of Buttons" (was "Crassula Perforata")
- `crassula_tetragona`: "Mini Pine Tree" (was "Crassula Tetragona")
- `peperomia_obtusifolia`: "Baby Rubber Plant" (was "Peperomia Obtusifolia")
- `peperomia_obtusifolia_variegated`: "Variegated Baby Rubber Plant"
- `euphorbia_trigona`: "African Milk Tree" (was "Euphorbia Trigona")
- `euphorbia_trigona_rubra`: "Royal Red African Milk Tree"
- `chamaedorea_palm`: "Parlor Palm" (was "Chamaedorea Palm")
- `fittonia`: "Nerve Plant" (was "Fittonia")
- `stapelia`: "Starfish Flower" (was "Stapelia")
- `alpinia_variegated`: "Variegated Shell Ginger" (was "Alpinia Variegated")
- `dracaena_jamaica`: "Song of Jamaica" (was "Dracaena Jamaica")

**Philosophy:** "Song of Jamaica" is more memorable and user-friendly than "Dracaena Jamaica" while botanical names remain searchable via aliases array.

#### 5. Enhanced Plant Matching (`src/services/plantnet.ts`)
- **Added Fields:** `primary_plant_name` and `primary_plant_info` to database match results
- **Display Logic:** Prefer database names over PlantNet's names when match found
- **Impact:** Users see "Song of Jamaica" instead of "Dracaena reflexa" when database match occurs
- **Tiers:** Exact match (95%), Genus match (80%), Common name match (60-100%)

### New Workflow (Going Forward)

**Golden Rules:**
1. ✅ **ALWAYS edit `docs/database_complete_detailed.csv`** (single source of truth)
2. ✅ **ALWAYS run `npm run sync-db`** after CSV changes
3. ✅ **ALWAYS run `npm run validate-db`** before committing
4. ❌ **NEVER manually edit `src/data/plantCareDatabase.json`** (auto-generated, will be overwritten)

**CSV Column Structure (22 columns):**
```
Plant ID, Common Name, Scientific Name, Genus, Family, Arabic Name,
Difficulty, Type, Pet Safe, Watering, Light Req, Light Desc,
Soil, Temp Range, Humidity, Fertilizer, Plant Info EN, Plant Info AR,
Cairo Suitability, Summer Care, Winter Care, Image URL
```

### Files Modified/Created
- ✨ **NEW:** `scripts/sync-csv-to-json.js` - Automated CSV to JSON conversion with genus reading
- ✨ **NEW:** `scripts/validate-database.js` - Data quality validation and schema checking
- ✨ **NEW:** `scripts/add-genus-column.js` - One-time genus column migration script
- 📝 **UPDATED:** `docs/database_complete_detailed.csv` - Now 22 columns with explicit Genus column
- 📝 **UPDATED:** `src/data/plantCareDatabase.json` - Auto-generated from CSV (135 plants with genus)
- 📝 **UPDATED:** `package.json` - Added `sync-db` and `validate-db` npm scripts
- 📝 **UPDATED:** `src/services/plantnet.ts` - Returns `primary_plant_name` for display preference

### Verification Results
- **Sync Output:** 135 plants synced successfully
- **Genus Coverage:** 135/135 plants have explicit genus field (100%)
- **Validation:** 0 errors, 34 warnings (short plant info - future improvement)
- **Song of Jamaica Check:** ✅ Correct in JSON: `common: "Song of Jamaica"`, `scientific: "Dracaena reflexa"`, `genus: "Dracaena"`

### Key Technical Learnings
- **Data Architecture:** Single source of truth prevents drift and manual errors
- **Genus Extraction Limitations:** Fails on hybrids, cultivars, and informal names (e.g., "Song of Jamaica" → "Song")
- **Backup Strategy:** Always create timestamped backups before destructive operations
- **Validation First:** Automated validation catches errors before users encounter them
- **User Experience:** Friendly common names improve memorability while botanical names ensure scientific accuracy