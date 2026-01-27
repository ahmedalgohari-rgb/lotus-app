# App Store Screenshot Guide

## Required Screenshots (iPhone 16 Pro Max - 1290×2796 px)

You need **5 screenshots** showing key features of your Lotus app.

### How to Capture Screenshots

1. **Navigate to each screen** listed below in your running simulator
2. **In Simulator menu**: File → Save Screen (or press `⌘S`)
3. **Save to**: `~/Lotus/app-store-assets/screenshots/en/`
4. **Name files**: `01-welcome.png`, `02-scan.png`, `03-result.png`, etc.

---

## Screenshot Checklist

### 1. Welcome/Onboarding Screen (`01-welcome.png`)
**What to show:**
- App logo and tagline: "AI-Powered Plant Care Assistant"
- "Get Started" or "Sign In" buttons visible
- Clean, inviting first impression

**Navigation:** Open app → Should show by default (or AuthScreen)

---

### 2. Plant Identification - Camera View (`02-scan.png`)
**What to show:**
- Camera viewfinder with green corner brackets
- Instruction pill: "Center the plant in the frame"
- Large capture button at bottom (80% from top)
- "Gallery" button visible bottom-left

**Navigation:**
- Tap "Scan" tab in bottom navigation
- OR: Home → "Identify Plant" button

**Tips:**
- Make sure green frame brackets are visible
- Instruction text should be clear and readable
- Capture button should be prominent

---

### 3. Identification Results (`03-result.png`)
**What to show:**
- Plant photo with identified name overlay
- Confidence percentage badge (e.g., "95% match")
- Plant care information preview
- "Add to My Plants" or "Save to My Garden" button

**Navigation:**
- After scanning a plant (use gallery photo if needed)
- OR: Use a test plant photo from your gallery

**Tips:**
- Use a high-confidence result (>80%)
- Show a popular plant (Snake Plant, Pothos, etc.)
- Make sure plant name is readable

---

### 4. Plant Collection (`04-collection.png`)
**What to show:**
- Grid view of saved plants with photos
- Plant cards showing common + scientific names
- "Add Plant" button visible
- At least 3-4 plants in collection

**Navigation:**
- Tap "My Plants" tab in bottom navigation
- If empty: Add a few test plants first

**Tips:**
- Variety of plant types for visual appeal
- Clean grid layout
- Plant names should be visible on cards

---

### 5. Care Tracking (`05-care.png`)
**What to show:**
- Individual plant details screen
- Watering schedule with next watering date
- Care event history (watering, fertilizing, pruning)
- Reminder settings or "Log Care" button

**Navigation:**
- My Plants → Tap on any plant card
- Shows PlantDetailScreen with care information

**Tips:**
- Show a plant with active care schedule
- Display at least 2-3 care events in history
- Highlight watering/fertilizing reminders

---

## After Capturing All 5 Screenshots

### Verify Quality
- [ ] Resolution: 1290 × 2796 pixels (check in Preview → Tools → Adjust Size)
- [ ] Format: PNG (not JPEG)
- [ ] File size: < 5MB each (should be ~200KB-1MB)
- [ ] No status bar showing fake time (iOS shows 9:41 AM by default - OK to keep)
- [ ] No personal data visible (test account names/emails)

### File Naming
- `01-welcome.png` - Onboarding/Welcome
- `02-scan.png` - Camera view with green frame
- `03-result.png` - Plant identification results
- `04-collection.png` - Plant grid/collection
- `05-care.png` - Plant details and care tracking

### Location
All files should be in:
```
~/Lotus/app-store-assets/screenshots/en/
```

---

## Optional: Arabic Screenshots

If you want to showcase Arabic localization (recommended for Egyptian market):

1. **Switch app language to Arabic** (Settings or language toggle)
2. **Retake all 5 screenshots** with Arabic UI and RTL layout
3. **Save to**: `~/Lotus/app-store-assets/screenshots/ar/`
4. **Same naming**: `01-welcome.png`, `02-scan.png`, etc.

---

## Troubleshooting

**Problem: Simulator not showing app**
- Wait 1-2 minutes for build to complete
- Check terminal output for errors
- Try: `npm run ios -- --simulator="iPhone 16 Pro Max"`

**Problem: Can't find File → Save Screen**
- Make sure Simulator app is in focus (not Xcode)
- Try keyboard shortcut: `⌘S`

**Problem: Wrong screen size**
- Verify simulator: iPhone 16 Pro Max
- Check: Simulator → Device → Manage Devices
- Should show: 1290 × 2796 pixels

**Problem: Screenshots look dark/washed out**
- Simulator → Features → Toggle Appearance (Light Mode)
- Ensure good contrast for visibility

---

## Quick Reference: Navigation Map

```
App Launch
├── AuthScreen (01-welcome.png)
└── Main App (after sign-in)
    ├── Home Tab
    │   └── "Identify Plant" → ScanScreen (02-scan.png)
    │       └── Capture Photo → PlantResultScreen (03-result.png)
    ├── Scan Tab → ScanScreen (02-scan.png)
    ├── My Plants Tab → MyPlantsScreen (04-collection.png)
    │   └── Tap Plant Card → PlantDetailScreen (05-care.png)
    └── Profile Tab
```

---

## Ready to Submit?

Once you have all 5 screenshots:
1. ✅ Verify file names and location
2. ✅ Check resolution and quality
3. ✅ Move on to **Task #4: Write App Store Metadata**

---

**Need help?** Ask Claude to guide you through any specific screenshot or troubleshooting step!
