# Stitch — Design Taste

Stitch design elements into a cohesive visual system for: **$ARGUMENTS**

## What This Skill Does

Take disparate design decisions — from different screens, different designers, different eras — and find the thread that unites them into a coherent system. Or identify why they can't be stitched and what needs to be rebuilt.

## The Stitching Problem

Designs fall apart into incoherence when:
- Multiple designers made decisions in isolation
- The product grew faster than the design system did
- A redesign was started but never completed
- Rebrand happened to marketing but not product
- Components were built on demand without a system

The result: users feel something is "off" without being able to articulate why.

## Coherence Audit

Evaluate the existing design elements for:

### Visual DNA
- Is there a consistent underlying grid?
- Does one typeface family govern all text?
- Is there a color system with defined roles, or an accumulation of one-off colors?
- Do components share a border radius value or do they vary?
- Is there a consistent shadow/elevation system?

### Tone and Personality
- Do all screens feel like they come from the same product?
- Where does the personality break? (usually in edge cases: error states, empty states, confirmation screens)
- Does the illustration or icon style match the UI style?

### Motion and Interaction
- Do transitions use consistent easing and duration?
- Are loading states consistently styled?
- Is hover/active/focus behavior consistent?

## Stitching Process

### 1. Extract the Common Thread

Find 3-5 elements that are most consistent and most loved. These are the DNA to preserve and extend.

### 2. Identify the Outliers

Flag elements that contradict the core DNA. Classify each:
- **Migrate**: bring it in line with the system
- **Retire**: remove it entirely
- **Anchor**: it's beloved enough to keep and extend the system around it

### 3. Define the Governing Tokens

Write the rules that will govern future decisions:
- Base unit: 8px
- Border radius: 8px (components), 12px (cards), 0px (inputs)
- Primary typeface: [Font], weights: 400/500/600
- Color roles: [list with hex values]
- Shadow: [values]

### 4. Migration Priority

What to stitch first (highest visibility, most inconsistency):
1. Navigation and global elements (see everywhere)
2. Primary actions (buttons, forms) — high conversion impact
3. Cards and list items — medium visibility
4. Edge cases (error states, empty states) — last pass

## Output

For $ARGUMENTS: coherence audit findings, extracted design DNA, governing tokens, and a priority migration list. Flag what requires designer decisions vs. what can be resolved algorithmically.
