# Layout

Provide layout and composition recommendations for: **$ARGUMENTS**

## What This Skill Does

Give precise layout direction — grid systems, compositional hierarchy, spacing logic, and responsive behavior — for web, mobile, and print.

## Layout Fundamentals

### Grid Systems

**For web (CSS Grid)**
- 12-column grid is standard for flexibility
- For simple layouts: 4-column (mobile), 8-column (tablet), 12-column (desktop)
- Column gutter: 16px (mobile) → 24px (tablet) → 32px (desktop)
- Side margins: 16px (mobile) → 32px (tablet) → auto (desktop, max-width container)

**For mobile (React Native / Flutter)**
- 4-column grid with 16px margins and 16px gutters
- Single column default with 16px padding
- Cards: 16px horizontal padding, 12-16px vertical padding

**For print / editorial**
- Baseline grid: line-height in multiples of 8px
- White space is structure — margins carry as much weight as content

### Compositional Hierarchy

Every layout must answer: what do you look at first, second, third?

Establish hierarchy through (in order of power):
1. **Size** — bigger elements rank higher
2. **Position** — top-left gets first attention (LTR), center gets emphasis
3. **Color/contrast** — high-contrast elements pull attention
4. **Space** — isolated elements feel more important
5. **Weight** — bold beats regular

Never fight these signals. A small, low-contrast element cannot be "most important."

### Spacing System

Use a consistent scale (multiples of 4 or 8):
- 4px — micro spacing (icon gaps, input padding)
- 8px — tight component spacing
- 16px — default spacing within components
- 24px — spacing between related components
- 32px — section breathing room
- 48px / 64px — major section breaks
- 80px / 120px — hero-level spacing

### Layout Patterns

**F-pattern** — for text-heavy content (eyes scan top, then left column)
**Z-pattern** — for landing pages (top-left → top-right → diagonal → bottom-right)
**Center focus** — for conversion pages (logo, headline, CTA, social proof)
**Card grid** — for browseable content (equal weight, discovery-oriented)

## Output

For $ARGUMENTS, deliver: grid specification, spacing rules, hierarchy analysis, and responsive breakpoint behavior. Flag any layout decisions that create accessibility or usability problems.
