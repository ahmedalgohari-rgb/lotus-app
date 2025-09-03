# 🌿 Lotus MVP - Simplified Screen Flow

## MVP Core Flow (5 Screens)

### 1. Welcome/Guidelines Screen
```
┌─────────────────────────┐
│                         │
│      🌿 LOTUS           │
│                         │
│  Plant Care Basics      │
│  ─────────────────      │
│                         │
│  💧 Most plants need    │
│     water weekly        │
│                         │
│  ☀️ Check light needs   │
│     for each plant      │
│                         │
│  🧭 Window direction    │
│     matters             │
│                         │
│  📍 Cairo Tip:          │
│     More water in       │
│     summer heat         │
│                         │
│                         │
│  [Start Scanning →]     │
│                         │
└─────────────────────────┘
```

### 2. Camera/Scan Screen
```
┌─────────────────────────┐
│ ← Back                  │
├─────────────────────────┤
│                         │
│   ┌─────────────┐       │
│   │             │       │
│   │   Camera    │       │
│   │   Preview   │       │
│   │             │       │
│   │  [Plant]    │       │
│   │             │       │
│   └─────────────┘       │
│                         │
│  Point at your plant    │
│                         │
│       ( ● )             │  Capture button
│                         │
└─────────────────────────┘
```

### 3. Plant Identified Screen
```
┌─────────────────────────┐
│ ← Back                  │
├─────────────────────────┤
│                         │
│    [Plant Photo]        │
│                         │
│  ✓ Identified!          │
│                         │
│  Pothos                 │
│  نبات البوتس            │
│                         │
│  ─────────────────      │
│                         │
│  Care Instructions:     │
│                         │
│  💧 Watering:           │
│     Every 5-7 days      │
│     ✓ Top watering OK   │
│     ✓ Bottom watering OK│
│                         │
│  ☀️ Light:              │
│     Indirect bright     │
│                         │
│  🧭 Best Position:      │
│     • North window ✓    │
│     • East window ✓     │
│     • West window ⚠️    │
│     • South window ✗    │
│                         │
│  [Add to My Plants]     │
│                         │
└─────────────────────────┘
```

### 4. Add Plant Details Screen
```
┌─────────────────────────┐
│ ← Cancel                │
├─────────────────────────┤
│                         │
│  Add Your Pothos        │
│                         │
│  Give it a nickname:    │
│  ┌─────────────────┐    │
│  │ e.g. "Bedroom"  │    │
│  └─────────────────┘    │
│                         │
│  Where is it?           │
│  ○ Living Room          │
│  ● Bedroom              │
│  ○ Kitchen              │
│  ○ Balcony              │
│                         │
│  Window Direction:      │
│  ○ North                │
│  ● East                 │
│  ○ South                │
│  ○ West                 │
│                         │
│  [Save Plant]           │
│                         │
└─────────────────────────┘
```

### 5. My Plants Screen
```
┌─────────────────────────┐
│      My Plants (3)      │
├─────────────────────────┤
│                         │
│  ┌─────────────────┐    │
│  │ [img] Pothos    │    │
│  │ "Bedroom"       │    │
│  │ East window     │    │
│  │ 💧 Water in 3d  │    │
│  └─────────────────┘    │
│                         │
│  ┌─────────────────┐    │
│  │ [img] Snake Plant│   │
│  │ "Living Room"   │    │
│  │ North window    │    │
│  │ 💧 Water in 7d  │    │
│  └─────────────────┘    │
│                         │
│  ┌─────────────────┐    │
│  │ + Add New Plant │    │
│  └─────────────────┘    │
│                         │
└─────────────────────────┘
```

---

## Technical Implementation Plan

### Phase 1: Core Features (Week 1-2)
1. **Plant Guidelines** - Static content about basic care
2. **Camera Integration** - Capture plant photos
3. **Plant Identification** - PlantNet API integration
4. **Care Instructions** - Database of care tips per plant type
5. **Local Storage** - Save user's plants locally

### Phase 2: Enhanced Features (Week 3-4)
1. **Window Direction Logic** - Smart recommendations based on direction
2. **Watering Technique** - Top vs bottom watering guidance
3. **Reminders** - Simple local notifications
4. **Multiple Plants** - Manage collection

### Key Design Elements (From Lotus Design Language)

#### Colors
```css
Primary Green: #2D5F3F
Secondary Blue: #4A90A4
Background: #F7F3E9
White: #FFFFFF
Text: #2C2C2C
```

#### Components
- **Cards**: White background, 16px border radius, subtle shadow
- **Buttons**: 48px height, 24px border radius, primary green
- **Typography**: System fonts, Arabic support
- **Spacing**: 8px grid system

---

## MVP Database Structure

### Plant Species Table
```json
{
  "id": "pothos",
  "name_en": "Pothos",
  "name_ar": "نبات البوتس",
  "watering_frequency": 7,
  "watering_method": ["top", "bottom"],
  "light_requirement": "indirect_bright",
  "window_positions": {
    "north": "excellent",
    "east": "good",
    "west": "moderate",
    "south": "avoid"
  },
  "cairo_tip": "Needs more water in summer"
}
```

### User Plant Table
```json
{
  "id": "uuid",
  "species_id": "pothos",
  "nickname": "Bedroom Plant",
  "location": "bedroom",
  "window_direction": "east",
  "last_watered": "2024-12-20",
  "added_date": "2024-12-15"
}
```

---

## User Journey (Simplified)

```
1. Open App → See care guidelines
2. Tap "Start Scanning"
3. Take photo of plant
4. View identification + care instructions
5. See window positioning recommendations
6. Add plant with nickname and location
7. View all plants in collection
8. Get watering reminders
```

---

## Success Metrics for MVP

- Users can identify at least 10 common houseplants
- Clear guidance on window positioning (N/S/E/W)
- Watering technique specified (top/bottom/any)
- Plants saved locally on device
- Simple, intuitive flow completed in <2 minutes

---

## What We're NOT Building (Yet)

- Social features
- Plant health diagnosis
- Complex scheduling
- User accounts/cloud sync
- Plant marketplace
- Community features
- Advanced plant problems

This keeps it simple, focused, and achievable for a true MVP!