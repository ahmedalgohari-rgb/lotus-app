# 🌿 Lotus Design System

**Last Updated:** November 6, 2025
**Status:** Active Implementation
**Violations Found:** 31 across 10 files

---

## Philosophy

> "Nature doesn't use random numbers. Neither should your UI."

Lotus uses the **Golden Ratio (φ ≈ 1.618)** and **Fibonacci Sequence** as the mathematical foundation for all design decisions. This isn't aesthetic preference - it's based on patterns found throughout nature, creating interfaces that feel inherently harmonious to users.

### Why Golden Ratio?

- **Visual Rhythm**: Human eyes naturally track proportions found in nature
- **Predictability**: Designers know exactly what spacing to use (no guessing "should this be 15px or 20px?")
- **Scalability**: The system works at any screen size
- **Accessibility**: Consistent sizing improves usability for all users

---

## 1. Typography System

### The Scale

Every font size is approximately **1.618× the previous size**, creating natural visual hierarchy:

```typescript
TYPOGRAPHY = {
  XXS: 10,   // Captions, metadata (e.g., "2 days ago")
  XS: 12,    // Helper text (e.g., form field hints)
  SM: 14,    // Secondary text (e.g., plant family name)
  BASE: 16,  // Body text, inputs (default reading size)
  MD: 18,    // Subheadings (e.g., section subtitles)
  LG: 21,    // Section titles (e.g., "Care Schedule")
  XL: 26,    // Page titles (e.g., screen headers)
  XXL: 34,   // Hero text (e.g., welcome messages)
  XXXL: 42,  // Major headlines
  HUGE: 55,  // Display text (rare, hero sections only)
}
```

### Usage Rules

| Element | Size | When to Use | Example |
|---------|------|-------------|---------|
| **Display** | HUGE (55) | Landing pages, major announcements | "Welcome to Lotus" |
| **H1** | XXL (34) | Screen titles | "My Plants" |
| **H2** | XL (26) | Major sections | "Plant Care Guide" |
| **H3** | LG (21) | Subsections | "Watering Schedule" |
| **Body** | BASE (16) | All reading content | Descriptions, paragraphs |
| **Secondary** | SM (14) | Supporting information | Scientific names, metadata |
| **Caption** | XS (12) | Labels, small text | Input placeholders, hints |
| **Micro** | XXS (10) | Timestamps, badges | "Updated 5m ago" |

### ❌ What NOT to Do

```typescript
// ❌ BAD - Random size not in system
fontSize: 19

// ✅ GOOD - Use the scale
fontSize: TYPOGRAPHY.MD  // 18
```

### Font Weights

```typescript
fontWeight: '300'  // Light - For large display text
fontWeight: '400'  // Regular - Default body text
fontWeight: '500'  // Medium - Emphasis, buttons
fontWeight: '600'  // Semibold - Subheadings
fontWeight: '700'  // Bold - Headlines, CTAs
```

**Rule:** Never go below `300` or above `700`. If you need more emphasis, increase font size instead.

---

## 2. Spacing System (Fibonacci Sequence)

Every spacing value comes from the **Fibonacci Sequence** (each number is the sum of the previous two):

```typescript
FIBONACCI = {
  XXS: 3,    // Minimal gaps (e.g., icon-to-text spacing)
  XS: 5,     // Tight spacing (e.g., label-to-input)
  SM: 8,     // Small gaps (e.g., list item internal padding)
  MD: 13,    // Default spacing (e.g., between form fields)
  LG: 21,    // Section spacing (e.g., between content blocks)
  XL: 34,    // Major gaps (e.g., screen edge padding)
  XXL: 55,   // Screen sections (e.g., between major UI areas)
  XXXL: 89,  // Large divisions (e.g., header height)
  HUGE: 144, // Structural elements (e.g., modal heights)
}
```

### The 3-Tier Spacing Mental Model

**Tier 1: Micro Spacing** (XXS-SM)
- Within a single component
- Example: Icon beside text, padding inside a button

**Tier 2: Component Spacing** (MD-LG)
- Between related components
- Example: Gap between form fields, card internal padding

**Tier 3: Layout Spacing** (XL-XXXL)
- Between major UI sections
- Example: Screen margins, section dividers

### Practical Application

```typescript
// ❌ BAD - Magic numbers
padding: 15
marginBottom: 20

// ✅ GOOD - Fibonacci values
padding: FIBONACCI.MD      // 13
marginBottom: FIBONACCI.LG  // 21

// ✅ EVEN BETTER - Named spacing for clarity
padding: FIBONACCI.MD      // "Default component padding"
marginBottom: FIBONACCI.LG  // "Section spacing"
```

### Common Patterns

| Use Case | Spacing | Value | Example |
|----------|---------|-------|---------|
| Screen edge padding | XL | 34 | `paddingHorizontal: FIBONACCI.XL` |
| Card padding | LG | 21 | `padding: FIBONACCI.LG` |
| Form field gaps | MD | 13 | `marginBottom: FIBONACCI.MD` |
| Button padding | SM | 8 | `paddingVertical: FIBONACCI.SM` |
| Icon-to-text gap | XS | 5 | `marginRight: FIBONACCI.XS` |

---

## 3. Color System

### Primary Palette

```typescript
COLORS = {
  // Brand Colors
  primary: '#2D5F3F',    // Lotus Green - Main brand color
  secondary: '#4A90A4',   // Nile Blue - Accent, CTAs

  // Neutrals
  background: '#F7F3E9',  // Cairo Sand - App background
  white: '#FFFFFF',       // Pure white - Cards, surfaces
  text: '#2C2C2C',        // Almost black - Primary text
  textSecondary: '#6B6B6B', // Gray - Secondary text
  border: '#E8E8E8',      // Light gray - Dividers, borders
  lightGray: '#F5F5F5',   // Subtle backgrounds

  // Semantic Colors
  success: '#52C41A',     // Green - Success states, healthy plants
  warning: '#FAAD14',     // Amber - Warnings, needs attention
  error: '#FF4D4F',       // Red - Errors, critical states
}
```

### Color Purpose & Usage

**1. Primary (`#2D5F3F` - Lotus Green)**
- ✅ Use for: Main CTAs, active states, primary icons
- ❌ Don't use for: Body text (too low contrast), backgrounds (too dark)
- Accessibility: AA contrast ratio against white

**2. Secondary (`#4A90A4` - Nile Blue)**
- ✅ Use for: Secondary actions, informational elements, accents
- ❌ Don't use for: Primary buttons (use `primary` instead)

**3. Background (`#F7F3E9` - Cairo Sand)**
- ✅ Use for: App-level background, creates warm, natural feel
- Why this color: Evokes Egyptian sand/parchment, differentiates from pure white apps

**4. Semantic Colors**
- **Success** → Healthy plants, completed tasks, confirmations
- **Warning** → Plants needing attention, alerts
- **Error** → Critical plant health, validation errors

### Text Color Rules

```typescript
// Primary text (headings, body)
color: COLORS.text  // #2C2C2C

// Secondary text (captions, metadata)
color: COLORS.textSecondary  // #6B6B6B

// Text on dark backgrounds
color: COLORS.white

// NEVER use pure black (#000000)
// It's too harsh - use COLORS.text instead
```

### Opacity Levels

When you need lighter versions of colors, use opacity instead of creating new colors:

```typescript
backgroundColor: COLORS.primary // Solid
backgroundColor: `${COLORS.primary}20` // 12% opacity
backgroundColor: `${COLORS.primary}40` // 25% opacity
backgroundColor: `${COLORS.primary}80` // 50% opacity
```

---

## 4. Component Patterns

### Buttons

**Sizes**

```typescript
ELEMENT_SIZES = {
  BUTTON_SM: 34,  // Compact buttons (e.g., in tight spaces)
  BUTTON_MD: 55,  // Default buttons (most common)
  BUTTON_LG: 89,  // Large CTAs (hero buttons)
}
```

**Button Anatomy**

```typescript
// Primary Button (main actions)
const primaryButton = {
  height: ELEMENT_SIZES.BUTTON_MD,  // 55
  paddingHorizontal: FIBONACCI.LG,   // 21
  backgroundColor: COLORS.primary,
  borderRadius: ELEMENT_SIZES.RADIUS_MD,  // 13
}

// Secondary Button (alternative actions)
const secondaryButton = {
  height: ELEMENT_SIZES.BUTTON_MD,
  paddingHorizontal: FIBONACCI.LG,
  backgroundColor: 'transparent',
  borderWidth: 2,
  borderColor: COLORS.primary,
  borderRadius: ELEMENT_SIZES.RADIUS_MD,
}

// Text Button (tertiary actions)
const textButton = {
  paddingVertical: FIBONACCI.SM,  // 8
  paddingHorizontal: FIBONACCI.MD, // 13
  // No background, just text
}
```

**When to Use Each Type**

- **Primary**: Main action on screen (only ONE per screen)
- **Secondary**: Alternative action (e.g., "Cancel" beside "Save")
- **Text**: Low-priority actions (e.g., "Skip", "Maybe later")

### Cards

```typescript
const cardStyle = {
  backgroundColor: COLORS.white,
  borderRadius: ELEMENT_SIZES.RADIUS_LG,  // 21
  padding: FIBONACCI.LG,  // 21
  marginBottom: FIBONACCI.MD,  // 13

  // Shadow for elevation
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 3, // Android
}
```

### Input Fields

```typescript
const inputStyle = {
  height: ELEMENT_SIZES.INPUT_MD,  // 55
  paddingHorizontal: FIBONACCI.MD,  // 13
  backgroundColor: COLORS.white,
  borderWidth: 1,
  borderColor: COLORS.border,
  borderRadius: ELEMENT_SIZES.RADIUS_SM,  // 8
  fontSize: TYPOGRAPHY.BASE,  // 16
  color: COLORS.text,
}

// Focus state
const inputFocused = {
  borderColor: COLORS.primary,
  borderWidth: 2,
}

// Error state
const inputError = {
  borderColor: COLORS.error,
}
```

### Modals

```typescript
const modalStyle = {
  flex: 1,
  justifyContent: 'flex-end',  // Bottom sheet style
  backgroundColor: 'rgba(0, 0, 0, 0.5)',  // 50% black overlay
}

const modalContent = {
  backgroundColor: COLORS.white,
  borderTopLeftRadius: FIBONACCI.XL,  // 34
  borderTopRightRadius: FIBONACCI.XL,
  paddingHorizontal: FIBONACCI.XL,  // 34
  paddingVertical: FIBONACCI.LG,  // 21
  maxHeight: '90%',  // Doesn't cover entire screen
}
```

---

## 5. Layout System (Golden Ratio Splits)

When dividing screen space, use **61.8% / 38.2% splits**:

```typescript
LAYOUT_RATIO = {
  MAJOR: 0.618,  // 61.8% - Primary content
  MINOR: 0.382,  // 38.2% - Secondary content
  FULL: 1.0,     // 100%
}
```

### Example: Two-Column Layout

```typescript
const screenWidth = Dimensions.get('window').width;
const { major, minor } = splitByGoldenRatio(screenWidth);

// Primary column: 618px (if screen is 1000px)
// Secondary column: 382px
```

### Example: Image-to-Text Ratio

```typescript
// Plant detail screen
const imageHeight = screenHeight * LAYOUT_RATIO.MAJOR  // 61.8%
const contentHeight = screenHeight * LAYOUT_RATIO.MINOR  // 38.2%
```

---

## 6. Icon System

```typescript
ELEMENT_SIZES = {
  ICON_XS: 13,   // Inline with small text
  ICON_SM: 21,   // Inline with body text
  ICON_MD: 34,   // Standard UI icons
  ICON_LG: 55,   // Feature icons
  ICON_XL: 89,   // Hero icons
}
```

**Usage:**

- **XS (13)**: Badges, tiny indicators
- **SM (21)**: Navigation icons, inline icons
- **MD (34)**: Primary action icons
- **LG (55)**: Feature illustrations
- **XL (89)**: Empty states, large illustrations

---

## 7. Border Radius

```typescript
ELEMENT_SIZES = {
  RADIUS_SM: 8,   // Subtle (inputs, small buttons)
  RADIUS_MD: 13,  // Standard (most UI elements)
  RADIUS_LG: 21,  // Pronounced (cards, large buttons)
  RADIUS_XL: 34,  // Extra rounded (modals, special elements)
}
```

**When to Use:**

- **SM (8)**: Input fields, small chips
- **MD (13)**: Buttons, small cards
- **LG (21)**: Large cards, image thumbnails
- **XL (34)**: Modals, bottom sheets

---

## 8. Enforcement Checklist

Before committing code, verify:

### Typography
- [ ] All `fontSize` values use `TYPOGRAPHY.*`
- [ ] No hardcoded font sizes (15, 17, 19, etc.)
- [ ] Font weights are 300, 400, 500, 600, or 700

### Spacing
- [ ] All `padding*` values use `FIBONACCI.*`
- [ ] All `margin*` values use `FIBONACCI.*`
- [ ] No magic numbers (12, 15, 20, etc.)

### Colors
- [ ] All colors use `COLORS.*`
- [ ] No hex codes in component styles
- [ ] Semantic colors used correctly (success/warning/error)

### Components
- [ ] Buttons use `ELEMENT_SIZES.BUTTON_*`
- [ ] Icons use `ELEMENT_SIZES.ICON_*`
- [ ] Border radius uses `ELEMENT_SIZES.RADIUS_*`

---

## 9. Current Violations

**Found:** 31 violations across 10 files

### Files to Audit

1. `src/screens/HomeScreen.tsx` (3 violations)
2. `src/screens/ScanScreen.tsx` (7 violations)
3. `src/screens/AddPlantScreen.tsx` (7 violations)
4. `src/components/SmartCameraOverlay.tsx` (4 violations)
5. `src/screens/PlantsScreen.tsx` (2 violations)
6. `src/screens/PlantDetailScreen.tsx` (2 violations)
7. `src/components/NameCollectionModal.tsx` (2 violations)
8. `src/components/PlantImage.tsx` (1 violation)

### Fix Pattern

```diff
- fontSize: 19
+ fontSize: TYPOGRAPHY.MD  // 18 (closest match)

- padding: 15
+ padding: FIBONACCI.MD  // 13 (or LG for 21)

- marginBottom: 20
+ marginBottom: FIBONACCI.LG  // 21
```

---

## 10. Quick Reference Card

### Most Common Values

| Use Case | Property | Value |
|----------|----------|-------|
| Screen padding | `paddingHorizontal` | `FIBONACCI.XL` (34) |
| Card padding | `padding` | `FIBONACCI.LG` (21) |
| Form field gap | `marginBottom` | `FIBONACCI.MD` (13) |
| Body text | `fontSize` | `TYPOGRAPHY.BASE` (16) |
| Section title | `fontSize` | `TYPOGRAPHY.LG` (21) |
| Page title | `fontSize` | `TYPOGRAPHY.XL` (26) |
| Button height | `height` | `ELEMENT_SIZES.BUTTON_MD` (55) |
| Icon size | `size` | `ELEMENT_SIZES.ICON_SM` (21) |
| Border radius | `borderRadius` | `ELEMENT_SIZES.RADIUS_MD` (13) |

---

## Conclusion

This design system isn't a suggestion - it's **mandatory**. Every pixel, every color, every spacing value should come from this system.

If you find yourself writing a hardcoded number, stop and ask: **"Which system value am I actually trying to use?"**

The answer is always in this document.
