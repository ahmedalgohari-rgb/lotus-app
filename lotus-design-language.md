# 🌿 Lotus Design Language System
*A calming, approachable design system for plant care in Cairo*

## Design Philosophy

### Core Principles

#### 1. **Breathable Simplicity**
Like a well-ventilated Cairo apartment balcony, the interface should feel open, airy, and uncluttered. Every element has room to breathe.

#### 2. **Bilingual Harmony**
Arabic and English coexist naturally, with Arabic taking priority in the Egyptian market. Neither language feels like an afterthought.

#### 3. **Botanical Warmth**
The app should feel like a peaceful garden oasis in the middle of Cairo's urban landscape - refreshing but familiar.

#### 4. **Instant Clarity**
Users should understand what to do within 3 seconds. No plant care jargon, no complex navigation.

---

## Visual Identity

### Color System

#### Primary Palette
```
Lotus Green (Primary)
#2D5F3F
RGB: 45, 95, 63
Use: Primary actions, healthy plants, success states

Nile Blue (Secondary)  
#4A90A4
RGB: 74, 144, 164
Use: Water-related actions, links, accents

Cairo Sand (Background)
#F7F3E9
RGB: 247, 243, 233
Use: Warm backgrounds, cards, subtle warmth
```

#### Semantic Colors
```
Healthy Plant
#4CAF50
Use: Thriving plants, success messages

Needs Attention
#FFC107  
Use: Water reminders, warnings

Critical Care
#F44336
Use: Dying plants, urgent alerts

Pure White
#FFFFFF
Use: Card backgrounds, input fields

Soft Gray
#9E9E9E
Use: Disabled states, secondary text
```

#### Gradient System
```css
/* Hero Gradient - App headers */
linear-gradient(135deg, #2D5F3F 0%, #4A90A4 100%)

/* Sand Gradient - Card backgrounds */
linear-gradient(180deg, #FFFFFF 0%, #F7F3E9 100%)

/* Morning Mist - Onboarding */
linear-gradient(180deg, #F7F3E9 0%, #E8F5E9 100%)
```

### Typography

#### Font Stack
```css
/* System fonts for optimal performance */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Cairo', 
            'Noto Sans Arabic', sans-serif;
```

#### Type Scale
```
Display (Hero)
32px / 40px line-height
Font-weight: 700
Use: App title, onboarding

H1 (Section Headers)
24px / 32px line-height  
Font-weight: 600
Use: Screen titles

H2 (Card Titles)
18px / 24px line-height
Font-weight: 600
Use: Plant names, section headers

Body (Default)
16px / 24px line-height
Font-weight: 400
Use: Descriptions, general text

Label
14px / 20px line-height
Font-weight: 500
Use: Form labels, buttons

Caption
12px / 16px line-height
Font-weight: 400
Use: Timestamps, helper text
```

#### Arabic Typography Rules
- Line height multiplier: 1.2x of English
- Right-to-left (RTL) layout
- Avoid italic (doesn't work well with Arabic)
- Increased letter spacing for readability

---

## Spatial System

### Grid & Spacing
```
Base unit: 8px

Spacing Scale:
2xs: 2px  (Inline elements)
xs:  4px  (Tight groups)
sm:  8px  (Related items)
md:  16px (Default spacing)
lg:  24px (Section breaks)
xl:  32px (Major sections)
2xl: 48px (Screen padding)
```

### Layout Grid
```
Mobile (Default):
- Columns: 4
- Margin: 16px
- Gutter: 16px

Tablet (Optional future):
- Columns: 8  
- Margin: 24px
- Gutter: 24px
```

---

## Component Library

### Buttons

#### Primary Button
```
Background: #2D5F3F
Text: #FFFFFF
Height: 48px
Border-radius: 24px
Font: 16px/600
Padding: 12px 24px

States:
- Default: #2D5F3F
- Pressed: #234A32 (darker 20%)
- Disabled: #9E9E9E
```

#### Secondary Button
```
Background: transparent
Border: 2px solid #2D5F3F
Text: #2D5F3F
Height: 48px
Border-radius: 24px
```

#### Quick Action Button (FAB)
```
Size: 56px × 56px
Background: Gradient (135deg, #2D5F3F 0%, #4A90A4 100%)
Icon: 24px white
Shadow: 0 8px 24px rgba(45, 95, 63, 0.3)
Position: Bottom right, 16px margin
```

### Cards

#### Plant Card
```
Structure:
┌─────────────────┐
│   [Plant Image] │ 160px height
│   ───────────   │ 
│   Plant Name    │ 18px/600
│   لقب النبات    │ 14px/400
│                 │
│   💧 3 days ago │ 12px/400
│                 │
│ [💧] [✂️] [🏥]  │ Quick actions
└─────────────────┘

Specs:
- Width: (screen-32)/2
- Background: white
- Border-radius: 16px
- Shadow: 0 4px 12px rgba(0,0,0,0.08)
- Padding: 0 (image full-width)
- Content padding: 12px
```

#### Health Indicators
```
Healthy: 🟢 (#4CAF50)
Warning: 🟡 (#FFC107)
Critical: 🔴 (#F44336)

Position: Top-right of plant image
Size: 12px dot with 16px tap target
```

### Forms

#### Text Input
```
Height: 48px
Background: #FFFFFF
Border: 1px solid #E0E0E0
Border-radius: 8px
Padding: 12px 16px
Font-size: 16px

States:
- Default: Border #E0E0E0
- Focus: Border #2D5F3F
- Error: Border #F44336
- Success: Border #4CAF50
```

#### Camera Viewfinder
```
Aspect ratio: 4:3
Overlay: Semi-transparent corners
Guide text: "Center your plant"
Capture button: 72px white circle
Border: 4px solid white
Inner: Red recording dot
```

### Navigation

#### Bottom Tab Bar
```
Height: 56px + safe area
Background: #FFFFFF
Shadow: 0 -2px 8px rgba(0,0,0,0.08)

Tab specs:
- Icon: 24px
- Label: 10px
- Active: #2D5F3F
- Inactive: #9E9E9E
- Indicator: 4px dot above icon
```

#### Header
```
Height: 56px
Background: Gradient or white
Title: Center, 18px/600
Back: Arrow icon, 24px
Actions: Right side, 24px icons
```

---

## Interaction Patterns

### Touch Targets
- Minimum: 44px × 44px (Apple HIG)
- Preferred: 48px × 48px
- Spacing between targets: 8px minimum

### Gestures
```
Tap: Primary action
Long press: Secondary menu
Swipe down: Refresh
Swipe left: Delete (with confirmation)
Pinch: Zoom images
```

### Animations

#### Timing Functions
```javascript
const easings = {
  standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)'
};

const durations = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 400
};
```

#### Common Animations
```
Page transition: 300ms, slide + fade
Card press: Scale to 0.98, 100ms
Success: Checkmark draw, 400ms
Loading: Pulsing plant icon, 1200ms loop
Water drop: Fall + splash, 600ms
```

### Feedback

#### Haptic Feedback (iOS)
- Light: Selection change
- Medium: Action confirmed
- Heavy: Important action/error

#### Visual Feedback
- Ripple effect on Android
- Highlight on iOS
- Scale on press (0.98)
- Color change on hover/focus

---

## Iconography

### Icon Style
- Style: Outlined, 2px stroke
- Size: 24px standard, 20px small, 32px large
- Corner radius: 2px for square icons
- Consistency: Same visual weight

### Core Icon Set
```
Navigation:
🏠 Home (garden)
📷 Camera
🏥 Plant doctor
⚙️ Settings

Actions:
💧 Water
✂️ Prune
🌱 Fertilize
🗑️ Delete
➕ Add new
📍 Location

Status:
☀️ Sunny
🌤️ Partial sun
🌥️ Shade
💀 Dead
🌿 Healthy
⚠️ Warning
```

---

## Content & Copy

### Voice & Tone

#### Principles
1. **Friendly, not formal** - Like a knowledgeable friend
2. **Clear, not clever** - Clarity over creativity
3. **Encouraging, not judgmental** - Positive reinforcement
4. **Brief, not verbose** - Respect user's time

#### Examples
```
❌ "Your Epipremnum aureum requires immediate hydration"
✅ "Your Pothos is thirsty! 💧"

❌ "Authentication failed. Please retry."
✅ "Oops! Let's try that again"

❌ "Fertilization schedule updated successfully"
✅ "Got it! Fertilizer reminder set"
```

### Bilingual Content

#### Arabic First
```
Screen layout:
┌──────────────────┐
│    حديقتي        │ (Arabic primary)
│    My Garden     │ (English secondary)
└──────────────────┘
```

#### Text Hierarchy
- Arabic: Slightly larger (1.1x)
- English: Secondary, lighter color (#666)
- Both: Never mixed in same sentence

### Error Messages

#### Structure
```javascript
{
  title: {
    ar: "عذراً",
    en: "Oops"
  },
  message: {
    ar: "لم نتمكن من التعرف على النبات",
    en: "Couldn't identify this plant"
  },
  action: {
    ar: "حاول مرة أخرى",
    en: "Try again"
  }
}
```

---

## Accessibility

### Standards
- WCAG 2.1 Level AA compliance
- Color contrast: 4.5:1 minimum
- Focus indicators: Visible always
- Screen reader: Full support

### Arabic Accessibility
- RTL layout switching
- Proper reading order
- Arabic screen reader labels
- Increased touch targets for Arabic text

### Testing Checklist
- [ ] VoiceOver (iOS) tested
- [ ] TalkBack (Android) tested  
- [ ] Keyboard navigation works
- [ ] Color blind modes checked
- [ ] Font scaling to 150% works
- [ ] RTL layout correct

---

## Screen Templates

### Home Screen (My Garden)
```
┌─────────────────────────┐
│ StatusBar               │
├─────────────────────────┤
│      🌿 حديقتي          │ 56px header
│       My Garden         │
├─────────────────────────┤
│                         │
│  ┌──────┐  ┌──────┐    │ Plant grid
│  │Plant │  │Plant │    │ 2 columns
│  │Card  │  │Card  │    │ 16px gap
│  └──────┘  └──────┘    │
│                         │
│  ┌──────┐  ┌──────┐    │
│  │Plant │  │ Add  │    │
│  │Card  │  │ New  │    │ Dashed border
│  └──────┘  └- - - ┘    │ for add new
│                         │
│         [📷 FAB]        │ Floating button
├─────────────────────────┤
│  🏠   📷   🏥   ⚙️      │ Tab bar
└─────────────────────────┘
```

### Plant Identification Result
```
┌─────────────────────────┐
│ < Back                  │
├─────────────────────────┤
│                         │
│    [Plant Image]        │ Full width
│                         │ 240px height
├─────────────────────────┤
│                         │
│  ✅ We found it!        │
│                         │
│  Money Plant            │ 24px bold
│  نبات البوتس            │ 20px
│                         │
│  Scientific name:       │ 14px gray
│  Epipremnum aureum     │
│                         │
│  Confidence: 92%        │ Pill badge
│                         │
│  ──────────────         │ Divider
│                         │
│  💧 Water every 5 days  │
│  ☀️ Indirect sunlight   │
│  🌡️ 18-30°C            │
│                         │
│  [Add to My Garden]     │ Primary button
│                         │
│  [Try Another Photo]    │ Text button
│                         │
└─────────────────────────┘
```

### Plant Doctor Diagnosis
```
┌─────────────────────────┐
│ < Back                  │
├─────────────────────────┤
│   🏥 Plant Doctor       │
├─────────────────────────┤
│                         │
│   [Problem Photo]       │ User's photo
│                         │
├─────────────────────────┤
│  Possible Issues:       │
│                         │
│  1. Overwatering (70%)  │ Probability
│     Yellow leaves,      │ pills
│     root rot risk      │
│     → Water less often  │ Solution
│                         │
│  2. Nutrient lack (20%) │
│     Pale coloring      │
│     → Add fertilizer    │
│                         │
│  3. Too much sun (10%)  │
│     Leaf burn          │
│     → Move to shade    │
│                         │
│  [Save Diagnosis]       │
│                         │
└─────────────────────────┘
```

---

## Responsive Behavior

### Screen Sizes (MVP - Phone only)
```
Small: 320px - 374px (iPhone SE)
Medium: 375px - 413px (iPhone 12)
Large: 414px+ (iPhone Plus)

Tablet: Future consideration
```

### Adaptive Elements
- Plant grid: 2 columns all sizes
- Font scaling: Respect system settings
- Image sizing: Aspect ratio maintained
- Button width: Max 320px on large screens

---

## Empty States

### No Plants Yet
```
Illustration: Potted plant outline
Title: "Start your garden!"
Message: "Add your first plant"
Action: [Take Photo] button
```

### No Internet
```
Icon: Wi-Fi off
Title: "No connection"
Message: "Check your internet"
Action: [Try Again]
```

### Plant Not Found
```
Icon: Question mark
Title: "Hmm, not sure"
Message: "Try another angle"
Action: [Retake Photo]
```

---

## Loading States

### Skeleton Screens
- Use for plant cards
- Shimmer animation
- Match actual content layout

### Progress Indicators
```
Identifying plant:
- Circular progress
- "Analyzing..." text
- 3 second timeout

Refreshing garden:
- Pull-to-refresh spinner
- Subtle, not blocking
```

---

## Dark Mode (Future)

### Planned Approach
- System-based switching
- Adjusted color palette
- Preserved hierarchy
- Reduced pure white

*Note: Not in MVP, planned for v1.1*

---

## Implementation Notes

### CSS-in-JS Example
```javascript
const styles = {
  plantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3, // Android
    marginBottom: 16,
    overflow: 'hidden'
  },
  
  plantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D5F3F',
    marginBottom: 4
  },
  
  arabicText: {
    fontSize: 20, // 1.1x larger
    fontWeight: '600',
    color: '#2D5F3F',
    textAlign: 'right',
    fontFamily: 'Cairo'
  }
};
```

### Design Tokens
```javascript
export const tokens = {
  colors: {
    primary: '#2D5F3F',
    secondary: '#4A90A4',
    background: '#F7F3E9',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
    white: '#FFFFFF',
    gray: '#9E9E9E'
  },
  
  spacing: {
    '2xs': 2,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48
  },
  
  typography: {
    display: { size: 32, weight: '700', height: 40 },
    h1: { size: 24, weight: '600', height: 32 },
    h2: { size: 18, weight: '600', height: 24 },
    body: { size: 16, weight: '400', height: 24 },
    label: { size: 14, weight: '500', height: 20 },
    caption: { size: 12, weight: '400', height: 16 }
  },
  
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24,
    full: 9999
  }
};
```

---

## Quality Checklist

Before any release:
- [ ] All text visible at 150% font scale
- [ ] Arabic/English both reviewed by native speakers
- [ ] Touch targets ≥ 44px
- [ ] Color contrast passes WCAG AA
- [ ] Animations respect reduced motion
- [ ] Works offline (core features)
- [ ] Loading states for all async operations
- [ ] Error states for all failures
- [ ] Empty states for all lists
- [ ] Consistent spacing throughout

---

*Document Version: 1.0.0 - MVP Focus*
*Last Updated: Design Phase*
*Next Review: Post-MVP Launch*