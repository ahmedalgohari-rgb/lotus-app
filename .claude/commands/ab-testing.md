# A/B Testing

Design, analyze, and recommend improvements based on A/B tests for: **$ARGUMENTS**

## What This Skill Does

Guide the full A/B testing lifecycle — from hypothesis formation through statistical analysis to shipping the winner.

## Process

### 1. Define the Test

- Identify the **one variable** being tested (headline, CTA, layout, price, etc.)
- State the **null hypothesis** and **alternative hypothesis**
- Define the **primary metric** (conversion rate, CTR, revenue per visitor)
- Define **guardrail metrics** (don't let these degrade)
- Estimate required **sample size** using: n = 16 * σ² / δ² (or flag if unknown)

### 2. Design the Variants

- **Control**: describe current state
- **Variant(s)**: describe what changes and why
- Explain the **rationale** — what psychological or UX principle does the variant test?

### 3. Analyze Results (if data provided)

- Calculate **observed conversion rates** for each variant
- Compute **relative lift**: (variant - control) / control
- Run a **chi-square or Z-test** for proportions
- Report **p-value** and whether it meets the significance threshold (default: p < 0.05)
- Report **95% confidence interval** on the lift
- Flag **Simpson's paradox** risks if segments differ

### 4. Recommend Action

- **Ship / Don't ship / Run longer** — with clear reasoning
- Minimum detectable effect achieved? Sample size sufficient?
- Suggest **follow-on tests** based on findings

## Output Format

```
TEST SUMMARY
Hypothesis: [clear statement]
Variable: [what changed]
Primary metric: [metric name]

RESULTS
Control:  X% (n=N)
Variant:  Y% (n=N)
Lift:     +Z% (95% CI: A% to B%)
p-value:  0.0X — [Significant / Not significant]

RECOMMENDATION
[Ship / Iterate / Run longer] — [reasoning in 2-3 sentences]

NEXT TEST
[Suggested follow-on experiment]
```
