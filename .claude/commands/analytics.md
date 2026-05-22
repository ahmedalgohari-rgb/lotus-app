# Analytics

Analyze metrics, data, and provide actionable insights for: **$ARGUMENTS**

## What This Skill Does

Turn raw metrics, dashboards, or data dumps into clear narratives with specific recommendations.

## Process

### 1. Understand the Data

- What is being measured? (product usage, marketing performance, revenue, retention)
- What time period does it cover?
- What is the comparison baseline? (prior period, target, competitor benchmark)
- Are there any known data quality issues?

### 2. Surface Key Findings

Identify and rank findings by impact:

**Wins** — metrics meaningfully above target or trend
**Concerns** — metrics declining or below benchmark
**Anomalies** — unexpected spikes, drops, or patterns worth investigating
**Flat spots** — metrics that aren't moving despite effort

### 3. Apply the MECE Framework

Segment data exhaustively and without overlap:
- By channel / source
- By user cohort / segment
- By time (day of week, time of day, seasonal)
- By product area / feature

### 4. Form Hypotheses

For each concern or anomaly, propose 2-3 testable hypotheses explaining the cause.
Rate each hypothesis: likely / possible / unlikely with reasoning.

### 5. Recommend Actions

For each significant finding:
- **Immediate action** (this week)
- **Investigation needed** (what data would confirm the hypothesis)
- **Longer-term fix** (if root cause is structural)

## Output Format

```
SUMMARY (3 sentences max)
[What's working, what's not, biggest opportunity]

TOP FINDINGS
1. [Metric]: [Value] vs [Benchmark] — [+/-X%] — [Interpretation]
2. ...

HYPOTHESES FOR [CONCERN]
- [Hypothesis 1]: [Evidence for / against]
- [Hypothesis 2]: ...

RECOMMENDED ACTIONS
Priority 1: [Action] → Expected impact: [outcome]
Priority 2: ...
```
