# Typeset

Provide typography and typesetting recommendations for: **$ARGUMENTS**

## What This Skill Does

Make deliberate typographic decisions — typeface selection, scale, spacing, weight, and rendering — that make text both readable and expressive.

## Typography Is Not Font Selection

Typography is the complete system of type decisions:
- Which typefaces and which weights
- How big (size scale)
- How far apart (line height and letter spacing)
- How long (line length)
- How structured (heading hierarchy)
- How it renders (anti-aliasing, hinting, subpixel)

Every decision affects both readability and personality.

## Typeface Selection

### Pairing Rules
- Maximum 2 typefaces in a system (display + text, or single family with variable weights)
- Contrast is the goal: pair a geometric sans with a humanist serif, not two similar sans-serifs
- Same typeface in different weights can replace a "pairing" in many cases

### Classification Guide

**Geometric Sans** (Futura, Inter, DM Sans): clean, modern, neutral, systematic
**Humanist Sans** (Gill Sans, Nunito, Muli): warm, friendly, readable at small sizes
**Grotesque** (Helvetica, Aktiv Grotesk, ABC Diatype): neutral, Swiss, corporate authority
**Transitional Serif** (Georgia, Libre Baskerville): editorial, trustworthy, classic web
**Modern Serif** (Canela, Freight Display): editorial, premium, magazine
**Slab Serif** (Rockwell, Clarendon): mechanical, bold, industrial
**Monospace** (JetBrains Mono, Courier): code, technical, brutalist context

### Free Options (Google Fonts)
- Inter — versatile, legible, excellent for UI
- Fraunces — display serif with personality
- DM Sans — friendly, contemporary
- Syne — distinctive, design-forward display
- Plus Jakarta Sans — warm, modern

## Type Scale

Use a modular scale (ratio 1.25 or 1.333 works well):

| Role | Size | Weight | Line Height | Letter Spacing |
|------|------|--------|-------------|----------------|
| Display H1 | 48-64px | 600-700 | 1.1 | -0.03em |
| H2 | 36-40px | 600 | 1.2 | -0.02em |
| H3 | 24-28px | 600 | 1.3 | -0.01em |
| Body large | 18px | 400 | 1.6 | 0 |
| Body default | 16px | 400 | 1.5 | 0 |
| Body small | 14px | 400 | 1.4 | 0 |
| Caption | 12px | 400-500 | 1.4 | +0.01em |
| Label / ALL CAPS | 11-12px | 500-600 | 1.2 | +0.08em |

## Measure (Line Length)

Optimal for reading: 65-75 characters per line (about 600px at 16px body).
Under 45 chars: too narrow (choppy rhythm)
Over 85 chars: too wide (eye loses the next line)

## Responsive Typography

At mobile (< 768px):
- H1: reduce to 32-40px
- Body: keep at 16px minimum (never below 16px on mobile)
- Line height: increase slightly (+0.1) for small screens

## Rendering

- `font-smoothing: antialiased` on macOS: makes thin weights appear lighter
- Avoid it for bold weights — it over-thins them
- Variable fonts: use where available, enables smooth weight transitions

## Output

For $ARGUMENTS: typeface recommendation with pairing rationale, complete type scale table, line length recommendation, and any platform-specific rendering notes.
