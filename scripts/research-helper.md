# 🔍 Real-Time Plant Research Helper

## When User Scans Unknown Plant

### Step 1: User Reports Unknown Plant
```
User: "Unknown plant detected: Philodendron gloriosum"
```

### Step 2: I Use WebSearch (Immediate)
I'll search for the plant and gather care data from trusted sources.

### Step 3: I Extract Care Data
- Watering schedule
- Light requirements
- Temperature range
- Humidity needs
- Pet safety
- Cairo suitability

### Step 4: I Add to CSV
I'll append a new row to `docs/database_complete_detailed.csv`

### Step 5: Sync Database
```bash
npm run sync-db
```

### Step 6: User Scans Again
The plant now has full care data! ✨

---

## Research Template (For Me to Fill)

When user reports unknown plant, I'll use this format:

```csv
[plant_id],[common_name],[scientific_name],[genus],[family],[arabic_name],[difficulty],[type],[pet_safe],[watering],[light_req],[light_desc],[soil],[temp_range],[humidity],[fertilizer],[plant_info_en],[plant_info_ar],[cairo_suit],[summer_care],[winter_care],[image_url]
```

## Quick Reference

### Watering Codes
- `daily: Description`
- `weekly: Description`
- `bi_weekly: Description`
- `monthly: Description`

### Light Codes
- `bright_direct`
- `bright_indirect`
- `medium_indirect`
- `low_indirect`

### Plant Types
- `foliage`
- `cactus`
- `succulent`
- `palm`
- `fern`
- `orchid`
- `bromeliad`
- `tropical`

### Difficulty
- `beginner`
- `intermediate`
- `expert`

### Pet Safety
- `yes` (safe)
- `no` (toxic)

### Cairo Suitability
- `excellent`
- `good`
- `challenging`

---

## Time Estimate

- WebSearch + research: **2-3 minutes**
- Add to CSV: **1 minute**
- Sync database: **10 seconds**
- **Total: ~4 minutes per plant**

---

## During Cafe Testing

I'll be ready to:
1. Receive unknown plant reports
2. Research immediately using WebSearch
3. Add to database in real-time
4. Confirm when ready to re-scan

This creates a **real-time plant learning system**! 🌿✨
