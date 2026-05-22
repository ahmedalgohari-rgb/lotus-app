# Industrial Brutalist UI

Direct industrial brutalist UI design for: **$ARGUMENTS**

## What This Skill Does

Apply industrial brutalist aesthetic principles to UI — raw, functional, unapologetically structural design that rejects decoration and makes the grid and mechanism visible.

## Brutalist UI Principles

Brutalism in UI is NOT ugliness for its own sake. It is:
- **Honesty of structure** — the grid, spacing, and mechanics are visible
- **No decorative surfaces** — if an element exists, it works
- **Raw materials** — system fonts, pure black/white, monospace, borders not shadows
- **Functional hierarchy** — importance determines size, period
- **Anti-skeuomorphism** — it looks like software, not a physical object

## Design Vocabulary

### Typography
- System stack or monospace: `-apple-system, 'Courier New', monospace`
- No font smoothing adjustment — let the OS render it raw
- All-caps for labels, headers, and navigation
- Tight tracking on display type (-0.02 to -0.04em)
- No font sizes between 12px and 24px if you can help it — commit to the jump

### Color
- Primary palette: pure black `#000`, pure white `#FFF`, one accent (often red `#FF0000`, yellow `#FFFF00`, or electric blue `#0000FF`)
- No gradients
- No shadows — use borders for depth
- Color as signal only: if something is red, it means danger or action

### Layout
- Visible grid — actual border lines, not implied whitespace
- Asymmetry is intentional (not balanced for balance's sake)
- Full-bleed sections, hard edges
- Tables > cards when data is tabular

### Interaction
- Hard state changes, no smooth transitions
- Hover: color inversion or border appearance
- No hover elevation effects
- Button: `border: 2px solid currentColor`, no border-radius

### Components
- Inputs: full-width, bottom-border only or full-border, no rounded corners
- Modals: no backdrop blur, hard overlay, header with thick border
- Navigation: text-only, numbered, or in a hard-rule ruled list

## What to Avoid

Do NOT:
- Add drop shadows or elevation
- Use border-radius > 2px (or use 0px)
- Use gradients, glassmorphism, or neumorphism
- Use decorative icons (functional icons only)
- Add hover animations that take more than 50ms

## Output

For $ARGUMENTS, deliver: color system, typography spec, key component styles (button, input, card, nav), and CSS/style token definitions ready to implement.
