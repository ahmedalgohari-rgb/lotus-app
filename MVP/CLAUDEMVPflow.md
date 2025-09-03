# 🌿 Lotus MVP - Complete Design System & Screen Flows
*Merging Behance Aesthetics with Cairo Warmth*

## Design Theme Overview
Combining the clean, modern aesthetic from the Behance reference with our warm Cairo-inspired Lotus color palette. The result is a premium yet approachable experience with bilingual support.

---

## Screen Flow Architecture

```
App Launch
    ↓
Splash Screen
    ↓
Onboarding (3 screens)
    ↓
Sign Up (Apple/Google OAuth)
    ↓
Home (Plant Guidelines)
    ↓
Camera Scan → Plant Identified → Add Details → My Plants
```

---

## Detailed Screen Designs

### 1. Splash Screen
```
┌─────────────────────────┐
│                         │
│                         │  Background: #F7F3E9
│                         │  (Cairo Sand)
│         🌿              │  
│                         │  Animated lotus icon
│       LOTUS             │  32px/700 - #2D5F3F
│                         │
│     نبتتك معانا         │  18px/500 - #4A90A4
│    Your plant buddy     │  14px/400 - #9E9E9E
│                         │
│                         │
│                         │
└─────────────────────────┘

Animation: Gentle fade in with leaf growth animation
Duration: 2 seconds
```

### 2. Onboarding - Screen 1
```
┌─────────────────────────┐
│                    Skip │  #4A90A4
├─────────────────────────┤
│                         │  Background: gradient
│                         │  #F7F3E9 → #E8F5E9
│    [Plant Illustration] │  
│         🌱              │  Custom illustration
│                         │  with subtle animation
│                         │
│  Identify Your Plants   │  24px/600 - #2D5F3F
│  تعرف على نباتاتك        │  20px/600 - #2D5F3F
│                         │
│  Take a photo and       │  14px/400 - #9E9E9E
│  instantly identify     │  Centered text
│  any houseplant         │
│                         │
│  ● ○ ○                  │  Progress dots
│                         │  #2D5F3F / #E8E8E8
│                         │
│      [Continue →]       │  52px height
│                         │  Background: gradient
└─────────────────────────┘  #2D5F3F → #4A90A4
                              Border-radius: 26px
```

### 3. Onboarding - Screen 2
```
┌─────────────────────────┐
│                    Skip │
├─────────────────────────┤
│                         │
│                         │
│    [Watering Animation] │  Animated water drops
│         💧              │  
│                         │
│                         │
│  Smart Care Reminders   │  24px/600 - #2D5F3F
│  تذكيرات العناية الذكية  │  20px/600 - #2D5F3F
│                         │
│  Get notified when      │  14px/400 - #9E9E9E
│  your plants need       │
│  water or care          │
│                         │
│  ○ ● ○                  │  Progress dots
│                         │
│                         │
│      [Continue →]       │
│                         │
└─────────────────────────┘
```

### 4. Onboarding - Screen 3
```
┌─────────────────────────┐
│                    Skip │
├─────────────────────────┤
│                         │
│                         │
│    [Window Compass]     │  N/S/E/W illustration
│         🧭              │  
│                         │
│                         │
│  Perfect Positioning    │  24px/600 - #2D5F3F
│  المكان المثالي          │  20px/600 - #2D5F3F
│                         │
│  Learn where to place   │  14px/400 - #9E9E9E
│  plants based on your   │
│  window direction       │
│                         │
│  ○ ○ ●                  │  Progress dots
│                         │
│                         │
│      [Get Started]      │  Primary button
│                         │
└─────────────────────────┘
```

### 5. Sign Up Screen
```
┌─────────────────────────┐
│                         │  Full bleed image
│    [Background Image]   │  Botanical photo
│                         │  with overlay gradient
│         🌿              │  
│       LOTUS             │  32px/700 - White
│                         │
├─────────────────────────┤
│                         │  Bottom sheet style
│  Welcome!               │  24px/600 - #2D5F3F
│  أهلاً بك               │  20px/600 - #2D5F3F
│                         │
│  Sign up to save your   │  14px/400 - #9E9E9E
│  plants and get care    │
│  reminders              │
│                         │
│  ┌─────────────────┐    │  OAuth buttons
│  │ 🍎 Apple         │    │  52px height
│  │ Continue with    │    │  Black background
│  │     Apple        │    │  White text
│  └─────────────────┘    │
│                         │
│  ┌─────────────────┐    │
│  │ G  Google        │    │  White background
│  │ Continue with    │    │  1px border #E8E8E8
│  │     Google       │    │  #2C2C2C text
│  └─────────────────┘    │
│                         │
│  ─────── OR ────────    │  Divider with text
│                         │
│  [Continue as Guest]    │  Text button
│                         │  #4A90A4
└─────────────────────────┘
```

### 6. Home - Plant Care Guidelines
```
┌─────────────────────────┐
│ 9:41 AM      100%  🔋  │  Status bar
├─────────────────────────┤
│                         │  Background: #F7F3E9
│  Hello, أحمد! 👋        │  18px/500 - #2D5F3F
│                         │
│  Plant Care Basics      │  24px/600 - #2D5F3F
│  أساسيات العناية        │  20px/600 - #2D5F3F
│                         │
│  ┌─────────────────┐    │  Tip cards
│  │ 💧 Watering     │    │  White background
│  │                 │    │  16px border-radius
│  │ Most plants     │    │  Padding: 16px
│  │ need water      │    │  Shadow: 0 4px 12px
│  │ every 5-7 days  │    │         rgba(0,0,0,0.08)
│  │                 │    │
│  │ Tip: Check soil │    │  12px/400 - #4A90A4
│  └─────────────────┘    │
│                         │
│  ┌─────────────────┐    │
│  │ ☀️ Light        │    │
│  │                 │    │
│  │ Bright indirect │    │
│  │ is best for     │    │
│  │ most plants     │    │
│  │                 │    │
│  │ Cairo Tip: North│    │
│  │ windows ideal   │    │
│  └─────────────────┘    │
│                         │
│  ┌─────────────────┐    │
│  │ 🧭 Position     │    │
│  │                 │    │
│  │ Window direction│    │
│  │ matters for     │    │
│  │ plant health    │    │
│  └─────────────────┘    │
│                         │
│    [Scan Plant 📷]      │  FAB style button
│                         │  60px diameter
├─────────────────────────┤  Gradient background
│  🏠    📷    🌱    👤   │  Tab bar - #FFFFFF
└─────────────────────────┘  Active: #2D5F3F
                              Inactive: #9E9E9E
```

### 7. Camera Scan Screen
```
┌─────────────────────────┐
│ ← Back           Flash  │  Overlay on camera
├─────────────────────────┤
│                         │
│                         │  Full screen camera
│   ╭─────────────╮       │  
│   │             │       │  Guide corners
│   │             │       │  #2D5F3F with 
│   │   [Plant]   │       │  60% opacity
│   │             │       │
│   │             │       │  4:3 aspect ratio
│   ╰─────────────╯       │
│                         │
│                         │
│  Center your plant      │  16px/500 - White
│  ضع النبات في المنتصف    │  14px/500 - White
│                         │  Text shadow for
│                         │  visibility
│         ╭───╮           │
│         │ ● │           │  Capture button
│         ╰───╯           │  72px diameter
│                         │  White with
│  [Gallery]  [Tips]      │  #2D5F3F border
│                         │  
└─────────────────────────┘
```

### 8. Plant Identified Screen
```
┌─────────────────────────┐
│ ← Back                  │
├─────────────────────────┤
│                         │  Background: #FFFFFF
│    [Captured Photo]     │  Full width
│                         │  200px height
│    ┌──────────┐         │  
│    │ 92% Match│         │  Confidence badge
│    └──────────┘         │  #4CAF50 background
│                         │
├─────────────────────────┤
│                         │  Bottom sheet
│  ✓ Identified!          │  16px/500 - #4CAF50
│                         │
│  Golden Pothos          │  24px/600 - #2D5F3F
│  البوتس الذهبي           │  20px/600 - #2D5F3F
│                         │
│  Epipremnum aureum     │  14px/400 italic
│                         │  #9E9E9E
│  ─────────────────      │  Divider
│                         │
│  Care Requirements      │  16px/600 - #2D5F3F
│  متطلبات العناية        │  14px/600 - #2D5F3F
│                         │
│  💧 Watering            │  Icon + text cards
│  ┌─────────────────┐    │  Light background
│  │ Every 5-7 days  │    │  #F7F3E9
│  │ • Top watering ✓│    │  8px border-radius
│  │ • Bottom water ✓│    │
│  └─────────────────┘    │
│                         │
│  ☀️ Light Requirements  │
│  ┌─────────────────┐    │
│  │ Bright indirect │    │
│  │ Avoid direct sun│    │
│  └─────────────────┘    │
│                         │
│  🧭 Window Position     │
│  ┌─────────────────┐    │
│  │ North: ⭐⭐⭐⭐⭐  │    │  5-star rating
│  │ East:  ⭐⭐⭐⭐☆  │    │  #FFC107 stars
│  │ South: ⭐⭐☆☆☆  │    │
│  │ West:  ⭐⭐⭐☆☆  │    │
│  └─────────────────┘    │
│                         │
│  [Add to My Plants]     │  Primary button
│                         │  Gradient background
└─────────────────────────┘
```

### 9. Add Plant Details
```
┌─────────────────────────┐
│ ← Cancel          Save  │  Save: #4A90A4
├─────────────────────────┤
│                         │
│  Customize Your Plant   │  24px/600 - #2D5F3F
│  خصص نباتك              │  20px/600 - #2D5F3F
│                         │
│  ┌─────────────────┐    │  Input field
│  │ Plant Nickname  │    │  Label: 12px/500
│  │ ─────────────── │    │  Border: #E8E8E8
│  │ Living Room     │    │  Focus: #2D5F3F
│  └─────────────────┘    │  48px height
│                         │
│  Plant Location         │  16px/600 - #2D5F3F
│  موقع النبات            │  14px/600 - #2D5F3F
│                         │
│  ┌──┐ Living Room       │  Radio buttons
│  ├──┤ Bedroom           │  Active: #2D5F3F
│  ├──┤ Kitchen           │  Inactive: #E8E8E8
│  ├──┤ Bathroom          │
│  └──┘ Balcony           │
│                         │
│  Window Direction       │  16px/600 - #2D5F3F
│  اتجاه النافذة          │  14px/600 - #2D5F3F
│                         │
│     N                   │  Compass selector
│     ↑                   │  Visual compass
│  W ← ● → E             │  with tap areas
│     ↓                   │  Selected: #2D5F3F
│     S                   │
│                         │
│  Selected: East         │  14px/500 - #4A90A4
│                         │
│  [Save Plant]           │  Primary button
│                         │
└─────────────────────────┘
```

### 10. My Plants Dashboard
```
┌─────────────────────────┐
│  My Plants (3)     ➕   │  Header with add
├─────────────────────────┤  Background: #F7F3E9
│                         │
│  Today's Tasks          │  16px/600 - #2D5F3F
│  مهام اليوم             │  14px/600 - #2D5F3F
│                         │
│  ┌─────────────────┐    │  Task card
│  │ 💧 2 plants need │    │  #4A90A4 background
│  │    watering      │    │  White text
│  │    [Water All]   │    │  Action button
│  └─────────────────┘    │
│                         │
│  Your Plants            │  16px/600 - #2D5F3F
│  نباتاتك                │  14px/600 - #2D5F3F
│                         │  
│  ┌──────┐  ┌──────┐     │  Plant grid
│  │      │  │      │     │  2 columns
│  │ IMG  │  │ IMG  │     │  16px gap
│  │      │  │      │     │  White cards
│  ├──────┤  ├──────┤     │  Border-radius: 16px
│  │Pothos│  │Snake │     │  Shadow
│  │Living│  │Plant │     │
│  │Room  │  │Bedroom│    │
│  │      │  │      │     │
│  │💧 2d │  │💧 5d │     │  Status badges
│  │☀️ E  │  │☀️ N  │     │  Window direction
│  └──────┘  └──────┘     │
│                         │
│  ┌──────┐  ┌──────┐     │
│  │      │  │  ➕   │     │  Add new card
│  │ IMG  │  │      │     │  Dashed border
│  │      │  │ Add  │     │  #E8E8E8
│  ├──────┤  │ New  │     │
│  │Cactus│  │Plant │     │
│  │Balcony  └──────┘     │
│  │      │               │
│  │💧 10d│               │
│  │☀️ S  │               │
│  └──────┘               │
│                         │
├─────────────────────────┤
│  🏠    📷    🌱    👤   │  Bottom navigation
└─────────────────────────┘
```

### 11. Plant Detail View
```
┌─────────────────────────┐
│ ← Back          Edit    │  
├─────────────────────────┤
│                         │
│    [Plant Photo]        │  Hero image
│                         │  240px height
│    ╭───────────╮        │  
│    │  Healthy  │        │  Status pill
│    ╰───────────╯        │  #4CAF50
│                         │
├─────────────────────────┤
│                         │  Content area
│  Golden Pothos          │  24px/600
│  البوتس الذهبي           │  20px/600
│  "Living Room Plant"    │  14px/400 - #9E9E9E
│                         │
│  Quick Actions          │  Action buttons row
│  ┌────┐ ┌────┐ ┌────┐  │  Icon buttons
│  │ 💧 │ │ ✂️ │ │ 🌱 │  │  48px squares
│  │Water│ │Prune│ │Feed│ │  Rounded corners
│  └────┘ └────┘ └────┘  │
│                         │
│  Care Schedule          │  Timeline view
│  ─────────────          │
│  Last watered: 2d ago   │
│  Next water: In 3 days  │
│  ●───●───○───○───○     │  Progress dots
│                         │
│  Plant Info             │  Info cards
│  ┌─────────────────┐    │
│  │ 📍 Location      │    │
│  │ Living Room     │    │
│  │ East Window     │    │
│  └─────────────────┘    │
│                         │
│  ┌─────────────────┐    │
│  │ 📅 Added        │    │
│  │ Dec 15, 2024    │    │
│  └─────────────────┘    │
│                         │
│  Care History           │  List view
│  ─────────────          │
│  • Dec 18: Watered ✓    │
│  • Dec 13: Watered ✓    │
│  • Dec 8: Fertilized ✓  │
│                         │
└─────────────────────────┘
```

---

## Component Library

### Buttons
```css
/* Primary Button - Gradient */
.btn-primary {
  background: linear-gradient(135deg, #2D5F3F 0%, #4A90A4 100%);
  height: 52px;
  border-radius: 26px;
  padding: 0 32px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  box-shadow: 0 4px 12px rgba(45, 95, 63, 0.25);
}

/* OAuth Buttons */
.btn-apple {
  background: #000000;
  height: 52px;
  border-radius: 12px;
  color: white;
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-google {
  background: #FFFFFF;
  height: 52px;
  border-radius: 12px;
  border: 1px solid #E8E8E8;
  color: #2C2C2C;
}

/* Icon Button */
.btn-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #F7F3E9;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### Cards
```css
/* Plant Card */
.plant-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.plant-image {
  width: 100%;
  height: 140px;
  object-fit: cover;
}

.plant-info {
  padding: 12px;
}

.plant-name {
  font-size: 16px;
  font-weight: 600;
  color: #2D5F3F;
}

.plant-location {
  font-size: 14px;
  color: #9E9E9E;
  margin-top: 4px;
}

.plant-status {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  font-size: 12px;
  color: #6B6B6B;
}
```

### Input Fields
```css
.input-field {
  height: 48px;
  background: white;
  border: 1px solid #E8E8E8;
  border-radius: 12px;
  padding: 0 16px;
  font-size: 16px;
}

.input-field:focus {
  border-color: #2D5F3F;
  outline: none;
}

.input-label {
  font-size: 12px;
  font-weight: 500;
  color: #9E9E9E;
  margin-bottom: 8px;
}
```

---

## Navigation Flow Diagram

```
                 App Launch
                     ↓
                Splash Screen
                     ↓
              Onboarding Flow
               (3 screens)
                     ↓
            ┌────────────────┐
            │  Sign Up/Login │
            │  (OAuth)       │
            └────────┬───────┘
                     ↓
            ┌────────────────┐
            │  Home Screen   │←─────┐
            │  (Guidelines)  │      │
            └────────┬───────┘      │
                     ↓              │
            ┌────────────────┐      │
            │  Camera Scan   │      │
            └────────┬───────┘      │
                     ↓              │
            ┌────────────────┐      │
            │ Plant Identified│      │
            └────────┬───────┘      │
                     ↓              │
            ┌────────────────┐      │
            │  Add Details   │      │
            └────────┬───────┘      │
                     ↓              │
            ┌────────────────┐      │
            │  My Plants     │──────┘
            └────────────────┘
```

---

## Responsive Breakpoints

```css
/* Mobile First Approach */
/* Small (iPhone SE) */
@media (max-width: 374px) {
  .container { padding: 16px; }
  .plant-grid { gap: 12px; }
}

/* Medium (iPhone 12) */
@media (min-width: 375px) {
  .container { padding: 20px; }
  .plant-grid { gap: 16px; }
}

/* Large (iPhone Plus) */
@media (min-width: 414px) {
  .container { padding: 24px; }
  .plant-grid { gap: 20px; }
}
```

---

## Implementation Priority

### Phase 1 - Core MVP (Week 1-2)
1. ✅ OAuth Integration (Apple/Google)
2. ✅ Basic navigation structure
3. ✅ Camera functionality
4. ✅ Plant identification API
5. ✅ Local storage for plants

### Phase 2 - Enhanced Features (Week 3-4)
1. ⏳ Push notifications for watering
2. ⏳ Care history tracking
3. ⏳ Multiple plant photos
4. ⏳ Export/share functionality
5. ⏳ Arabic localization completion

---

## Design Assets Needed

1. **Icons**: Custom icon set for plants, care actions
2. **Illustrations**: Onboarding screens (3), empty states
3. **Photos**: Sample plant images for testing
4. **Lottie Animations**: Loading states, success animations

---

*Design System Version: 1.0.0*
*Last Updated: December 2024*
*Platform: iOS & Android (React Native)*