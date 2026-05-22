# Design Taste — Frontend

Apply strong frontend design taste to critique or direct UI aesthetics for: **$ARGUMENTS**

## What This Skill Does

Bring opinionated, high-taste frontend design direction — identifying what makes UI feel dated, generic, or amateur, and prescribing what makes it feel considered, modern, and intentional.

## The Taste Framework

Good UI design taste is the ability to feel discomfort before you can articulate why. Develop it by asking:
- Does this feel designed or defaulted?
- Would this fit in a Stripe, Linear, or Vercel product?
- Is every visual decision deliberate or just whatever the framework gave us?

## Frontend Design Dimensions to Evaluate

### Spacing and Rhythm

- Is spacing consistent across the system? (pick a base unit: 4px or 8px)
- Does the layout breathe? Or is it cramped?
- Are content blocks separated with intention, not just padding?

### Typography

- Font pairing: does it feel considered? (one display font + one text font max)
- Type scale: is there a clear hierarchy? (H1 vs H2 vs body vs caption should feel distinct)
- Line height: body copy at 1.5-1.6 feels right; headings at 1.1-1.2
- Letter spacing: uppercase labels should be tracked (+0.05em); body text should not

### Color and Contrast

- Is the primary color used sparingly for emphasis, or splattered everywhere?
- Do neutral grays have subtle color temperature (warm or cool), not flat #808080?
- Does every color serve a purpose? Decorative colors are noise

### Components and Polish

- Rounded corners: consistent radius scale (4px for inputs, 8px for cards, 12px+ for modals)
- Shadow system: one or two shadows max, directional light source consistent
- Icons: single set, consistent weight, aligned to text baseline
- Empty states: designed, not blank

### Motion

- Transitions: 150-200ms for micro-interactions, ease-out for entering, ease-in for exiting
- No motion for motion's sake — it should communicate state change
- Reduced motion media query respected?

## Output

For each element of $ARGUMENTS, provide:
1. What it looks like now (diagnosis)
2. What's wrong with it (the taste problem)
3. What to do instead (specific value, not "improve it")
