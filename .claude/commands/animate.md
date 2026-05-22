# Animate

Animation and motion design direction for: **$ARGUMENTS**

## What This Skill Does

Provide precise animation specifications, motion principles, and implementation guidance for UI/UX and brand motion design.

## Process

### 1. Define the Motion Purpose

Every animation should serve a function:
- **Orientation** — helps users understand spatial relationships (slide in from source)
- **Feedback** — confirms an action was received (button press, form submit)
- **Transition** — smooths state changes (page nav, modal open)
- **Delight** — adds personality without interfering (subtle bounce, gentle pulse)
- **Loading** — communicates progress or waiting states

Identify which function applies and design accordingly.

### 2. Motion Principles

Apply these in order of priority:
- **Duration**: Micro (100-200ms), Standard (200-400ms), Expressive (400-700ms)
- **Easing**: Use physics-based curves
  - Enter: ease-out (fast → slow, feels natural arriving)
  - Exit: ease-in (slow → fast, feels natural leaving)
  - Emphasis: ease-in-out for elements that stay on screen
- **Properties to animate**: opacity, transform (translate/scale/rotate) — never animate width/height/top/left (causes repaints)
- **Stagger**: When animating lists, delay each item by 30-60ms

### 3. Specification Format

For each animation, provide:

```
Element: [what is animating]
Trigger: [user action or state change]
Duration: [Xms]
Easing: [curve name or cubic-bezier values]
Properties:
  - opacity: 0 → 1
  - transform: translateY(8px) → translateY(0)
Delay: [Xms or stagger formula]
Notes: [any special behavior, reduced-motion fallback]
```

### 4. Reduced Motion

Always provide a `prefers-reduced-motion` fallback:
- Replace movement with opacity-only transitions
- Or instant show/hide with no animation

### 5. Implementation Notes

Specify the target implementation: CSS transitions, CSS keyframes, Framer Motion, React Native Animated API, Lottie, or GSAP — and provide starter code.
