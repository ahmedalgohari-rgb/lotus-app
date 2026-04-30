# Lotus - Business Case & Unit Economics
## Reverse-Engineered Financial Model | Plant Care App for Egypt

**Version:** 1.0 | **Date:** April 23, 2026
**Status:** Post-launch (App Store approved April 11, 2026)
**Current Model:** Free (no monetization)
**Bundle ID:** `com.lotus.plantcare` | **Version:** 1.1.0 (Build 58)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Market Sizing (TAM / SAM / SOM)](#2-market-sizing)
3. [Revenue Model Options](#3-revenue-model-options)
4. [Feature-to-Revenue Mapping](#4-feature-to-revenue-mapping)
5. [User Adoption Funnel & Assumptions](#5-user-adoption-funnel)
6. [Unit Economics](#6-unit-economics)
7. [Product P&L Structure](#7-product-pl-structure)
8. [Core Metrics Dashboard](#8-core-metrics-dashboard)
9. [Competitive Benchmarking](#9-competitive-benchmarking)
10. [Scenario Modeling](#10-scenario-modeling)
11. [What Drives Revenue](#11-what-drives-revenue)
12. [Assumptions Register](#12-assumptions-register)

---

## 1. Executive Summary

Lotus is a **bilingual (Arabic/English) plant care app built for Egypt** — the first of its kind in the MENA region. The app is live on the App Store with AI plant identification, Cairo weather-integrated care, and a curated database of 135+ plants.

**Current state:** Free app, zero revenue, zero monetization infrastructure.
**Opportunity:** Egypt has 30M+ smartphone users, a growing post-COVID indoor plant trend, and zero localized competition. Global competitors (Planta, PictureThis, Greg) charge $10-35/year but offer no Arabic support, no Cairo weather integration, and no Egyptian-specific care.

**The business question:** Can we build a sustainable revenue model by converting free users to paying subscribers, and at what scale does this become a real business?

### Key Numbers at a Glance

| Metric | Conservative | Base | Optimistic |
|--------|-------------|------|-----------|
| Year 1 Users (total installs) | 5,000 | 15,000 | 40,000 |
| Year 1 Paying Subscribers | 125 | 600 | 2,400 |
| Year 1 Revenue (USD) | $3,750 | $21,600 | $115,200 |
| Monthly Burn Rate | $25 | $50 | $200 |
| Months to Profitability | 3 | 2 | 1 |

---

## 2. Market Sizing

### 2.1 Total Addressable Market (TAM)

**Global plant care app market:**

| Metric | Value | Source |
|--------|-------|--------|
| Global market size (2025) | ~$800M | Allied Market Research, plant app segment |
| CAGR (2023-2030) | 12-15% | Multiple industry reports |
| Global smartphone plant app users | ~50M | Sensor Tower estimates |
| PictureThis downloads (lifetime) | 100M+ | App Store listing |
| Planta downloads (lifetime) | 10M+ | App Store listing |

**TAM = $800M** (global plant care app market)

### 2.2 Serviceable Addressable Market (SAM)

**MENA + Arabic-speaking market:**

| Metric | Value | Notes |
|--------|-------|-------|
| Egypt population | 106M | 2025 estimate |
| Egypt smartphone penetration | ~55% | ~58M smartphone users |
| Egypt App Store users (iOS) | ~12M | iOS market share ~20% in Egypt |
| MENA Arabic speakers with smartphones | ~180M | GCC + North Africa |
| Indoor plant interest (Egypt, post-COVID) | Growing 15-20% YoY | Google Trends Egypt "نباتات زينة" |
| Egyptians who own houseplants | ~30-40% of urban households | Market estimate |

**SAM = ~5M** (Arabic-speaking, smartphone-owning, plant-interested users in Egypt + MENA)

**SAM Revenue Potential:** 5M users x 3% conversion x $24/yr avg = **$3.6M/yr**

### 2.3 Serviceable Obtainable Market (SOM)

**What we can realistically capture in Year 1-3:**

| Timeframe | Installs | Active Users | Rationale |
|-----------|----------|-------------|-----------|
| Year 1 | 15,000 | 4,500 | Organic + social media, no paid ads |
| Year 2 | 60,000 | 18,000 | Word of mouth, ASO, content marketing |
| Year 3 | 200,000 | 60,000 | Paid acquisition, partnerships, Android launch |

**SOM Year 1 = 15,000 installs** (base case, organic growth only)

---

## 3. Revenue Model Options

### 3.1 Recommended: Freemium Subscription ("Lotus Pro")

Based on competitor pricing and Egyptian purchasing power:

| Tier | Price (USD) | Price (EGP) | What's Included |
|------|------------|-------------|-----------------|
| **Free** | $0 | Free | Unlimited scanning, 3 saved plants, basic care tips |
| **Lotus Pro Monthly** | $2.99/mo | ~150 EGP/mo | Unlimited plants, advanced care, weather alerts, export |
| **Lotus Pro Annual** | $23.99/yr | ~1,200 EGP/yr | Same as monthly (33% discount) |
| **Lotus Pro Lifetime** | $49.99 | ~2,500 EGP | One-time, lifetime access |

**Why this pricing:**
- Planta charges $35/yr globally — too high for Egypt
- Greg charges $10/yr — closer but still no localization
- $24/yr ($2/mo effective) is the sweet spot for Egyptian purchasing power
- Egyptian app spending averages $1-3/mo for premium apps

### 3.2 Alternative: Tiered Feature Model

| Feature | Free | Pro ($2.99/mo) | Notes |
|---------|------|----------------|-------|
| AI Plant Scanning | Unlimited | Unlimited | Core hook, never gate |
| Save to Garden | 3 plants | Unlimited | Conversion trigger |
| Care Schedule | Basic | Personalized + weather-adjusted | Key differentiator |
| Watering Reminders | 1 plant | Unlimited | High-retention feature |
| Care History | Last 7 days | Full history | Data stickiness |
| Plant Encyclopedia | 20 plants | Full 135+ database | Content value |
| Weather Alerts | None | Real-time Cairo alerts | Unique to Lotus |
| Export/Share Garden | None | PDF/Image export | Social feature |
| Priority Support | None | In-app chat | Trust builder |

### 3.3 Additional Revenue Streams (Future)

| Stream | Revenue Potential | Timeline | Effort |
|--------|------------------|----------|--------|
| In-app plant shop partnerships | $0.50-2 per referral | Q3 2026 | Medium |
| Sponsored plant of the week | $200-500/mo per sponsor | Q4 2026 | Low |
| B2B API for nurseries | $50-200/mo per business | 2027 | High |
| Plant care courses | $5-15 per course | 2027 | Medium |
| Physical products (pots, tools) | Marketplace commission | 2028 | High |

---

## 4. Feature-to-Revenue Mapping

### 4.1 Which Features Drive Conversions?

This maps every feature to its role in the revenue funnel:

```
ACQUISITION (Free)          ACTIVATION (Aha!)           REVENUE (Pro)
─────────────────          ──────────────────          ──────────────
AI Plant Scanner    ───►   "It knows my plant!"  ───►  Save 4th plant (paywall)

Guest Mode          ───►   Scan 3+ plants        ───►  "I need to save these"

Arabic/RTL          ───►   "Finally, in Arabic!" ───►  Emotional loyalty

Cairo Weather       ───►   "It knows my city!"   ───►  Weather alerts (Pro)

Care Tips           ───►   Plant survives!        ───►  Full care guide (Pro)

Notifications       ───►   "Saved my plant"       ───►  Unlimited reminders (Pro)
```

### 4.2 Feature Impact Matrix

| Feature | Acquisition Impact | Retention Impact | Revenue Impact | Priority |
|---------|-------------------|-----------------|---------------|----------|
| AI Scanner | **HIGH** (viral hook) | Medium | Low (free) | P0 |
| Arabic/RTL | **HIGH** (no competition) | High | Medium (loyalty) | P0 |
| Cairo Weather | Medium | **HIGH** (daily use) | **HIGH** (Pro gate) | P1 |
| Save to Garden | Low | **HIGH** (data lock-in) | **HIGH** (paywall trigger) | P1 |
| Care Reminders | Low | **HIGH** (habit loop) | **HIGH** (Pro gate) | P1 |
| Placement Score | Low | Medium | Medium | P2 |
| Care History | Low | Medium | Medium (Pro gate) | P2 |
| Plant Encyclopedia | Medium | Low | Low | P3 |

### 4.3 Revenue Attribution Model

Estimated contribution of each feature to a conversion event:

| Feature Touch | Weight | Reasoning |
|--------------|--------|-----------|
| 4th plant save attempt (paywall) | 35% | Direct conversion trigger |
| Push notification saves a plant | 25% | "This app saved my plant" moment |
| Weather alert was accurate | 15% | Trust + perceived value |
| Arabic content resonated | 15% | Emotional connection, no alternatives |
| Care history showed progress | 10% | Sunk cost + progress visibility |

---

## 5. User Adoption Funnel

### 5.1 Funnel Stages & Conversion Assumptions

```
App Store Impression ──► 100,000
        │ 15% CVR (App Store page → Install)
        ▼
Install ────────────── 15,000
        │ 70% open within 7 days
        ▼
First Open ─────────── 10,500
        │ 60% scan a plant (core action)
        ▼
First Scan ─────────── 6,300
        │ 50% create account (after "aha moment")
        ▼
Registered User ────── 3,150
        │ 65% save at least 1 plant
        ▼
Active Gardener ────── 2,048
        │ 40% hit 3-plant limit (free cap)
        ▼
Hit Paywall ────────── 819
        │ 30% convert within 7 days of paywall
        ▼
Trial Start ────────── 246
        │ 55% complete trial → paid
        ▼
Paying Subscriber ──── 135     ◄── Month 1 cohort
        │ 85% monthly retention
        ▼
Month 12 Retained ──── 17      ◄── From original Month 1 cohort
```

### 5.2 Monthly Cohort Build-Up (Base Case)

| Month | New Installs | New Subscribers | Churned | Total Active Subs | MRR (USD) |
|-------|-------------|----------------|---------|-------------------|-----------|
| M1 | 1,250 | 45 | 0 | 45 | $135 |
| M2 | 1,250 | 45 | 7 | 83 | $249 |
| M3 | 1,250 | 50 | 12 | 121 | $363 |
| M4 | 1,250 | 50 | 18 | 153 | $459 |
| M5 | 1,250 | 55 | 23 | 185 | $555 |
| M6 | 1,250 | 55 | 28 | 212 | $636 |
| M7 | 1,250 | 55 | 32 | 235 | $705 |
| M8 | 1,250 | 55 | 35 | 255 | $765 |
| M9 | 1,250 | 55 | 38 | 272 | $816 |
| M10 | 1,250 | 55 | 41 | 286 | $858 |
| M11 | 1,250 | 55 | 43 | 298 | $894 |
| M12 | 1,250 | 55 | 45 | 308 | $924 |
| **Year 1 Total** | **15,000** | **630** | — | **308** | **$7,359 ARR** |

**Assumptions:** 15% monthly churn, $2.99/mo price, organic growth only

### 5.3 Seasonal Adoption Patterns (Egypt-Specific)

| Season | Install Multiplier | Rationale |
|--------|-------------------|-----------|
| Spring (Mar-May) | 1.5x | Planting season, Ramadan gift culture |
| Summer (Jun-Sep) | 1.3x | "Help my plant survive!" urgency |
| Autumn (Oct-Nov) | 1.0x | Baseline |
| Winter (Dec-Feb) | 0.7x | Less plant activity, but indoor focus |

---

## 6. Unit Economics

### 6.1 Key Metrics

| Metric | Value | Calculation | Benchmark |
|--------|-------|-------------|-----------|
| **ARPU** (all users) | $1.44/yr | $21,600 revenue / 15,000 installs | Industry: $1-3 |
| **ARPPU** (paying users) | $28.68/yr | $21,600 / 753 unique subscribers | Industry: $20-40 |
| **LTV** (subscriber) | $47.88 | $2.99/mo x 16 avg months | Industry: $30-80 |
| **CAC** (organic) | $0 | No paid acquisition | — |
| **CAC** (paid, future) | $1.50-3.00 | Egypt CPM ~$2-4, CPI ~$1.50 | MENA avg |
| **LTV:CAC** (organic) | Infinite | $47.88 / $0 | Target: >3:1 |
| **LTV:CAC** (paid) | 16:1 - 32:1 | $47.88 / $1.50-3.00 | Excellent |
| **Payback Period** | 0 days (organic) | No acquisition cost | Target: <90 days |
| **Payback Period** (paid) | 15-30 days | $3 CAC / $2.99 first month | Excellent |

### 6.2 LTV Calculation Detail

```
LTV = ARPU x Avg Subscriber Lifetime

Monthly churn rate:     15%
Avg subscriber months:  1 / 0.15 = 6.67 months (monthly plan)
Annual plan retention:  70% renew → avg 2.3 years

Monthly subscriber LTV: $2.99 x 6.67 = $19.94
Annual subscriber LTV:  $23.99 x 2.3 = $55.18
Lifetime purchase LTV:  $49.99 x 1.0 = $49.99

Blended LTV (40% monthly, 45% annual, 15% lifetime):
= (0.40 x $19.94) + (0.45 x $55.18) + (0.15 x $49.99)
= $7.98 + $24.83 + $7.50
= $40.31
```

### 6.3 Revenue Per Feature (Estimated Attribution)

| Feature | % of Revenue | Year 1 Revenue | Notes |
|---------|-------------|----------------|-------|
| Unlimited plant saves | 35% | $7,560 | Primary paywall trigger |
| Unlimited notifications | 25% | $5,400 | Habit-forming, high retention |
| Weather-based care alerts | 15% | $3,240 | Unique differentiator |
| Full care guides | 15% | $3,240 | Content depth |
| Care history + export | 10% | $2,160 | Data value |
| **Total** | **100%** | **$21,600** | Base case |

---

## 7. Product P&L Structure

### 7.1 Year 1 P&L (Base Case - $21,600 Revenue)

| Line Item | Monthly | Annual | % of Revenue |
|-----------|---------|--------|-------------|
| **Revenue** | | | |
| Subscription Revenue (iOS) | $1,800 | $21,600 | 100% |
| | | | |
| **Cost of Revenue** | | | |
| Apple's 30% commission (Year 1) | ($540) | ($6,480) | 30.0% |
| Supabase (free → Pro if needed) | ($0-25) | ($0-300) | 0-1.4% |
| PlantNet API (free tier) | $0 | $0 | 0% |
| Apple WeatherKit (included) | $0 | $0 | 0% |
| **Gross Profit** | **$1,235** | **$14,820** | **68.6%** |
| | | | |
| **Operating Expenses** | | | |
| Apple Developer Program | ($8.25) | ($99) | 0.5% |
| Domain + hosting (GitHub Pages) | $0 | $0 | 0% |
| Marketing (organic only) | $0 | $0 | 0% |
| Cloud infrastructure overflow | ($0-25) | ($0-300) | 0-1.4% |
| **Total OpEx** | **($8-58)** | **($99-399)** | **0.5-1.8%** |
| | | | |
| **Net Profit** | **$1,177-1,227** | **$14,421-14,721** | **66.8-68.2%** |

### 7.2 Year 1 P&L (Conservative - $3,750 Revenue)

| Line Item | Annual | % of Revenue |
|-----------|--------|-------------|
| Subscription Revenue | $3,750 | 100% |
| Apple Commission (30%) | ($1,125) | 30% |
| Gross Profit | $2,625 | 70% |
| Apple Developer ($99) | ($99) | 2.6% |
| **Net Profit** | **$2,526** | **67.4%** |

### 7.3 Year 1 P&L (Optimistic - $115,200 Revenue)

| Line Item | Annual | % of Revenue |
|-----------|--------|-------------|
| Subscription Revenue | $115,200 | 100% |
| Apple Commission (30%) | ($34,560) | 30% |
| Supabase Pro Plan | ($300) | 0.3% |
| Gross Profit | $80,340 | 69.7% |
| Apple Developer ($99) | ($99) | 0.1% |
| Marketing budget | ($5,000) | 4.3% |
| **Net Profit** | **$75,241** | **65.3%** |

### 7.4 Cost Scaling Thresholds

| Users | Supabase | PlantNet | Estimated Monthly Cost |
|-------|----------|----------|----------------------|
| 0 - 500 | Free | Free (500 req/day) | $8/mo (Apple only) |
| 500 - 5,000 | Free | Free | $8/mo |
| 5,000 - 50,000 | Pro ($25/mo) | Free | $33/mo |
| 50,000 - 100,000 | Pro ($25/mo) | Paid ($50/mo) | $83/mo |
| 100,000+ | Team ($599/mo) | Enterprise | $700+/mo |

---

## 8. Core Metrics Dashboard

### 8.1 Quarterly Review Framework

**"How did our product do this quarter?"**

| Category | Metric | How to Measure | Target |
|----------|--------|---------------|--------|
| **Growth** | Monthly installs | App Store Connect | +15% MoM |
| | Install-to-register CVR | Installs → accounts created | >20% |
| | Organic vs paid split | Attribution tracking | >80% organic Y1 |
| **Engagement** | DAU / MAU ratio | Active users daily / monthly | >25% |
| | Scans per user per week | Avg scan events | >1.5 |
| | Plants saved per user | Avg collection size | >2.5 |
| | Session duration (minutes) | Avg time in app | >3 min |
| **Revenue** | MRR | Monthly recurring revenue | +10% MoM |
| | ARPU | Revenue / total users | >$0.12/mo |
| | ARPPU | Revenue / paying users | >$2.50/mo |
| | LTV | Blended subscriber LTV | >$40 |
| **Retention** | D1 / D7 / D30 retention | Cohort analysis | 60% / 35% / 20% |
| | Subscriber churn rate | Monthly cancellations / total | <15% |
| | Reactivation rate | Churned users who return | >5% |
| **Efficiency** | CAC | Cost per acquired user | <$3 |
| | LTV:CAC ratio | Blended LTV / CAC | >3:1 |
| | Payback period | Months to recover CAC | <3 months |

### 8.2 Leading vs Lagging Indicators

| Leading (Predict Future Revenue) | Lagging (Confirm Past Performance) |
|----------------------------------|--------------------------------------|
| Scan volume this week | MRR this month |
| Free users hitting 3-plant limit | Churn rate last month |
| Push notification open rate | LTV of 6-month cohorts |
| Arabic language preference % | ARPU trend (3-month) |
| App Store rating trend | Net revenue retention |

### 8.3 Metric Definitions

```
MRR    = Sum of all active monthly subscription fees
ARR    = MRR x 12
ARPU   = Total Revenue / Total Users (including free)
ARPPU  = Total Revenue / Paying Users only
LTV    = ARPPU x (1 / monthly churn rate)
CAC    = Total Acquisition Spend / New Users Acquired
NRR    = (MRR start + expansion - contraction - churn) / MRR start
```

---

## 9. Competitive Benchmarking

### 9.1 Competitor Overview

| | **Lotus** | **Planta** | **PictureThis** | **Greg** |
|---|-----------|-----------|----------------|---------|
| **Price** | Free (Pro: $24/yr) | $35/yr | $30/yr | $10/yr |
| **Downloads** | New | 10M+ | 100M+ | 1M+ |
| **Rating** | TBD | 4.7 | 4.6 | 4.8 |
| **Arabic** | Native Egyptian | No | No | No |
| **Cairo Weather** | Yes (WeatherKit) | No | No | No |
| **Egypt Care Tips** | Yes (135 plants) | No | No | No |
| **Free Scanning** | Unlimited | Limited | Limited | No |
| **Offline DB** | Yes (135 plants) | Partial | No | No |
| **Revenue Model** | Freemium | Subscription | Subscription | Subscription |
| **Est. Revenue** | $0 | $15-25M/yr | $50-100M/yr | $3-5M/yr |

### 9.2 Pricing Position

```
Price/Year:  $0          $10         $24         $30         $35
             │           │           │           │           │
             ▼           ▼           ▼           ▼           ▼
          Lotus Free    Greg     Lotus Pro   PictureThis   Planta
             │                      │
             └──────────────────────┘
             Egyptian purchasing power sweet spot
```

### 9.3 Competitive Moat Analysis

| Moat Type | Lotus Strength | Defensibility |
|-----------|---------------|---------------|
| **Language** | Only Egyptian Arabic plant app | HIGH — competitors won't localize for 1 country |
| **Local data** | Cairo weather + Egyptian seasons | HIGH — requires local knowledge |
| **Cultural** | Egyptian humor, dialect, UX | HIGH — can't be copied by foreign teams |
| **Database** | 135 plants curated for Egypt | MEDIUM — can be replicated with effort |
| **Price** | Free + cheap Pro | LOW — anyone can price match |
| **Technology** | Standard React Native + APIs | LOW — no proprietary tech |

---

## 10. Scenario Modeling

### 10.1 Three-Year Revenue Projections

#### Conservative (Slow organic growth, low conversion)

| Year | Installs | Paying Users | Revenue | Net Profit |
|------|----------|-------------|---------|-----------|
| Y1 | 5,000 | 125 | $3,750 | $2,526 |
| Y2 | 15,000 | 500 | $15,000 | $10,152 |
| Y3 | 40,000 | 1,600 | $48,000 | $31,200 |

#### Base (Moderate growth, social media traction)

| Year | Installs | Paying Users | Revenue | Net Profit |
|------|----------|-------------|---------|-----------|
| Y1 | 15,000 | 600 | $21,600 | $14,721 |
| Y2 | 60,000 | 3,600 | $108,000 | $72,360 |
| Y3 | 200,000 | 14,000 | $420,000 | $277,200 |

#### Optimistic (Viral content, partnerships, Android launch)

| Year | Installs | Paying Users | Revenue | Net Profit |
|------|----------|-------------|---------|-----------|
| Y1 | 40,000 | 2,400 | $115,200 | $75,241 |
| Y2 | 200,000 | 16,000 | $576,000 | $374,400 |
| Y3 | 750,000 | 67,500 | $2,430,000 | $1,555,200 |

### 10.2 Break-Even Analysis

| Scenario | Fixed Costs/Year | Subscribers Needed | Revenue Needed | Months to Break-Even |
|----------|-----------------|-------------------|---------------|---------------------|
| Solo dev (current) | $99 | 3 annual subs | $99 | 1-2 |
| + Supabase Pro | $399 | 12 annual subs | $399 | 2-3 |
| + Marketing ($500/mo) | $6,399 | 189 annual subs | $6,399 | 6-8 |
| + Part-time hire ($1K/mo) | $18,399 | 543 annual subs | $18,399 | 10-14 |

### 10.3 Sensitivity Analysis

**Revenue sensitivity to key variables (Base case: $21,600):**

| Variable | -50% | Base | +50% | Impact |
|----------|------|------|------|--------|
| Install volume | $10,800 | $21,600 | $32,400 | LINEAR |
| Free→Paid CVR | $10,800 | $21,600 | $32,400 | LINEAR |
| Price ($2.99/mo) | $10,800 | $21,600 | $32,400 | LINEAR |
| Churn rate (15%) | $14,400 | $21,600 | $28,800 | INVERSE |
| Apple commission | $24,192 | $21,600 | $19,008 | INVERSE |

**Highest-leverage variable:** Install volume and conversion rate have equal linear impact. Focus on whichever is cheaper to improve.

---

## 11. What Drives Revenue

### 11.1 Revenue Drivers Ranked by Impact

```
#1  CONVERSION RATE (Free → Paid)
    Current: 0% (no paywall exists)
    Target:  4% (industry benchmark for freemium utility apps)
    Levers:  Paywall placement, trial offer, pricing

#2  USER ACQUISITION (Total Installs)
    Current: Organic only
    Target:  1,250/mo (Y1), 5,000/mo (Y2)
    Levers:  ASO, social content, referral program, paid ads

#3  RETENTION (Subscriber churn)
    Current: N/A
    Target:  <15% monthly churn
    Levers:  Push notifications, seasonal content, habit loops

#4  PRICING (ARPU optimization)
    Current: $0
    Target:  $2.99/mo or $23.99/yr
    Levers:  A/B testing, regional pricing, annual plan incentives

#5  EXPANSION (Upsell / cross-sell)
    Current: N/A
    Target:  10% of subscribers buy add-ons
    Levers:  Plant shop partnerships, courses, physical goods
```

### 11.2 The "Float" — Free User Adoption Calculation

**Total Float** = Free users who haven't converted but could.

```
Total Installs:           15,000
Registered (free):         3,150  (21%)
Active free users:         2,048  (13.7%)
Hit paywall (3+ plants):    819  (5.5%)
Never converted:            684  (4.6%)  ◄── THIS IS THE FLOAT
```

**Float value:** 684 users x 30% eventual conversion x $40 LTV = **$8,208 unrealized revenue**

**How to capture the float:**
1. Seasonal re-engagement (summer heat alerts → "upgrade to protect your plants")
2. Time-limited offers (Ramadan 50% off, Black Friday)
3. Feature unlocks (new Pro feature → notify float users)
4. Social proof ("2,000+ Egyptian plant parents use Lotus Pro")

### 11.3 Feature → Revenue Decision Framework

When deciding what to build next, score each feature:

```
Revenue Score = (Acquisition Impact x 0.2) +
                (Conversion Impact x 0.4) +
                (Retention Impact x 0.3) +
                (Expansion Impact x 0.1)

Scale: 1-5 for each dimension
```

| Feature Candidate | Acq | Conv | Ret | Exp | **Score** | Priority |
|-------------------|-----|------|-----|-----|-----------|----------|
| Paywall implementation | 0 | 5 | 0 | 0 | **2.0** | NOW |
| Plant community/social | 4 | 2 | 3 | 1 | **2.8** | HIGH |
| Android app | 5 | 2 | 1 | 0 | **1.9** | HIGH |
| Advanced weather alerts | 1 | 3 | 4 | 0 | **2.6** | MEDIUM |
| Plant shop partnerships | 2 | 1 | 2 | 5 | **1.9** | MEDIUM |
| AI diagnosis (sick plants) | 5 | 3 | 3 | 0 | **3.1** | HIGH |
| Referral program | 5 | 1 | 1 | 0 | **1.7** | MEDIUM |

---

## 12. Assumptions Register

### 12.1 User Assumptions

| # | Assumption | Value | Confidence | Source | Validation Method |
|---|-----------|-------|-----------|--------|------------------|
| A1 | Egypt iOS smartphone users | 12M | High | Statista, GSMA | Public data |
| A2 | Plant interest rate (urban Egypt) | 30-40% | Medium | Google Trends, social | Survey needed |
| A3 | App Store CVR (impression→install) | 15% | Medium | Industry benchmarks | App Store Connect data |
| A4 | Install→Register CVR | 21% | Medium | Industry avg for free apps | Analytics (implement) |
| A5 | Register→Active CVR | 65% | Medium | Industry avg | Analytics |
| A6 | Year 1 organic installs | 15,000 | Low | Estimate, no comparable | Track monthly |

### 12.2 Revenue Assumptions

| # | Assumption | Value | Confidence | Source | Validation Method |
|---|-----------|-------|-----------|--------|------------------|
| R1 | Free→Paid conversion rate | 4% | Medium | Freemium app benchmark | A/B test |
| R2 | Monthly subscription price | $2.99 | Medium | Competitor analysis | Price testing |
| R3 | Annual vs monthly split | 45% / 40% | Low | Industry average | Track actual |
| R4 | Monthly subscriber churn | 15% | Medium | Utility app benchmark | Cohort analysis |
| R5 | Annual subscriber renewal | 70% | Medium | Industry benchmark | Track Y2 |
| R6 | Apple commission rate | 30% (Y1), 15% (Y2+) | High | Apple policy | Apple Small Business Program |

### 12.3 Cost Assumptions

| # | Assumption | Value | Confidence | Source | Validation Method |
|---|-----------|-------|-----------|--------|------------------|
| C1 | Supabase free tier limit | 500 DAU | High | Supabase docs | Monitor usage |
| C2 | PlantNet free tier | 500 req/day | High | PlantNet docs | Monitor usage |
| C3 | CAC (paid, future) | $1.50-3.00 | Low | MENA benchmarks | Campaign testing |
| C4 | Marketing budget (Y1) | $0 | High | Current plan | Decision |
| C5 | Infrastructure at 50K users | $33/mo | Medium | Provider pricing | Scale testing |

### 12.4 Market Assumptions

| # | Assumption | Value | Confidence | Source | Validation Method |
|---|-----------|-------|-----------|--------|------------------|
| M1 | No Arabic competitor enters Y1 | Yes | Medium | Market scan | Monitor App Store |
| M2 | Egypt plant interest continues growing | 15% YoY | Low | Trend extrapolation | Google Trends |
| M3 | Egyptian willingness to pay for apps | $1-3/mo | Medium | Regional data | Survey + test |
| M4 | iOS-first is correct (vs Android) | Yes | Medium | Higher ARPU on iOS | Launch Android Y2 |

---

## Appendix A: Quarterly Business Review Template

```
LOTUS QUARTERLY BUSINESS REVIEW — Q[X] 2026

1. REVENUE
   - MRR: $___  (vs target: $___)
   - ARR: $___  (vs last quarter: $___,  +/- __%)
   - New subscribers: ___
   - Churned subscribers: ___
   - Net revenue retention: ___%

2. USERS
   - Total installs (cumulative): ___
   - New installs this quarter: ___
   - DAU / MAU: ___ / ___  (ratio: __%)
   - Registered users: ___
   - Free→Paid conversion: ___%

3. ENGAGEMENT
   - Avg scans/user/week: ___
   - Avg plants saved: ___
   - Push notification open rate: ___%
   - Arabic vs English users: __% / __%

4. UNIT ECONOMICS
   - ARPU: $___/mo
   - LTV (new cohort): $___
   - CAC: $___
   - LTV:CAC: ___:1
   - Payback period: ___ days

5. COSTS
   - Total cost of revenue: $___
   - Gross margin: ___%
   - Infrastructure costs: $___/mo
   - Marketing spend: $___

6. NEXT QUARTER PRIORITIES
   - [ ] ___
   - [ ] ___
   - [ ] ___
```

---

## Appendix B: Excel Model Structure

For the finance team, build an Excel workbook with these tabs:

| Tab | Contents |
|-----|----------|
| **Assumptions** | All values from Section 12, color-coded by confidence |
| **Funnel** | Monthly cohort model (Section 5.2), formulaic |
| **P&L** | Monthly P&L with actuals vs forecast columns |
| **Unit Economics** | LTV, CAC, ARPU calculations with sensitivity |
| **Scenarios** | Conservative / Base / Optimistic toggle (data validation dropdown) |
| **Dashboard** | Charts: MRR trend, funnel CVRs, retention curves, LTV:CAC |
| **Quarterly** | QBR template (Appendix A) with actuals filled in |

**Key formulas to include:**
```
MRR = SUMPRODUCT(subscriber_count, plan_price)
LTV = ARPPU / monthly_churn_rate
CAC = total_marketing_spend / new_users_acquired
Gross_Margin = (Revenue - COGS) / Revenue
NRR = (start_MRR + expansion - contraction - churn) / start_MRR
Months_to_breakeven = fixed_costs / (MRR - variable_costs)
```

---

*This document is a living model. Update assumptions monthly as real data replaces estimates.*

*Generated: April 23, 2026 | Lotus v1.1.0 | Pre-monetization phase*
