# Colorize

Recommend color palettes for UI, brand, or design projects: **$ARGUMENTS**

## What This Skill Does

Generate purposeful color systems — not random swatches — grounded in brand intent, accessibility requirements, and usage context.

## Process

### 1. Understand the Context

- What is being designed? (mobile app, website, brand identity, marketing materials)
- What emotion or perception should the color convey?
- Who is the audience? (age, culture, professional context)
- Are there existing brand colors to work within or around?
- Accessibility requirements? (WCAG AA = 4.5:1 minimum for body text)

### 2. Define the Palette Roles

Every color system needs these roles filled:

- **Primary** — brand color, main CTAs, key UI elements
- **Secondary** — supporting actions, accents, hover states
- **Neutral** — text, backgrounds, dividers (usually grays)
- **Success / Error / Warning / Info** — system feedback colors
- **Surface / Background** — card backgrounds, page backgrounds

### 3. Color Recommendations

For each color provide:
- **Hex value** (and RGB / HSL)
- **Usage** — where exactly this color appears
- **Do not use for** — common misuse to avoid
- **Contrast ratio** against white and black backgrounds

### 4. Color Relationships

Explain the harmony used:
- Monochromatic, analogous, complementary, split-complementary, triadic
- Why this harmony fits the brand intent

### 5. Dark Mode Variants

Provide dark mode equivalents for each palette color, noting inversion strategy (don't just invert — recommend purpose-built dark values).

## Output Format

```
PRIMARY
#[hex] | RGB([r],[g],[b]) | Contrast on white: X.X:1
Use for: [specific UI roles]

SECONDARY
...

NEUTRALS (5-step scale)
[lightest to darkest with hex values]

SEMANTIC COLORS
Success: #[hex]
Error: #[hex]
Warning: #[hex]
Info: #[hex]

DARK MODE ADJUSTMENTS
[Primary on dark: #hex]
...
```
