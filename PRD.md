# 🌿 Lotus - Product Requirements Document (PRD)
*Plant Care App for Egyptian Market - MVP Release*

**Version:** 1.0.0  
**Date:** 2024  
**Status:** In Development  
**Target Launch:** 3 Weeks  

---

## 1. Executive Summary

### 1.1 Product Vision
Lotus is a mobile-first plant care application designed specifically for the Egyptian market, helping users keep their plants alive in Cairo's unique climate through AI-powered identification, localized care reminders, and simple plant health diagnostics.

### 1.2 Problem Statement
**78% of urban Egyptians** who purchase plants lose them within the first 3 months due to:
- Lack of localized plant care knowledge for Egypt's climate
- No Arabic language support in existing plant apps
- Overwhelming complexity in current solutions
- Missing context for Cairo's specific environmental conditions

### 1.3 Solution
A simple, bilingual (Arabic/English) mobile app that:
- Identifies plants instantly using AI
- Sends personalized care reminders based on Cairo weather
- Diagnoses plant problems with simple solutions
- Works offline for core features

---

## 2. Market Analysis

### 2.1 Market Opportunity
- **Market Size:** 12M+ urban households in Egypt
- **Target Segment:** 2.5M households with disposable income for plants
- **Growth Rate:** 35% YoY increase in plant purchases post-COVID
- **Competition Gap:** No localized solution for MENA region

### 2.2 Competitive Landscape
| Competitor | Strengths | Weaknesses | Our Advantage |
|------------|-----------|------------|---------------|
| Plantora | Global reach, comprehensive | No Arabic, not localized | Egyptian-focused |
| PictureThis | Advanced AI | Expensive, complex | Simple, affordable |
| Planta | Beautiful UI | Subscription-only | Freemium model |
| Local nurseries | Trust, expertise | No digital presence | Digital convenience |

---

## 3. Target Users

### 3.1 Primary Persona: "Mariam" (60% of users)
- **Age:** 25-35
- **Location:** Urban Egypt (Cairo, Alexandria, Giza)
- **Tech Savvy:** High smartphone usage, active on social media
- **Behavior:** 
  - Bought plants during COVID but struggled to keep them alive
  - Switches between Arabic and English naturally
  - Values aesthetics and wants Instagram-worthy plants
  - Busy professional with limited time for research
- **Pain Points:**
  - Plants die despite best efforts
  - Conflicting advice online
  - No trusted Arabic resources
- **Goals:**
  - Keep plants alive and thriving
  - Quick, reliable answers
  - Beautiful home/balcony

### 3.2 Secondary Persona: "Ahmed" (40% of users)
- **Age:** 30-45
- **Location:** New Cairo, 6th October City
- **Tech Savvy:** Moderate, practical app user
- **Behavior:**
  - Family-oriented, wife wants nice garden
  - Prefers Arabic interface
  - Budget-conscious
  - Weekend gardener
- **Pain Points:**
  - Kids or pets damage plants
  - Unsure about plant safety
  - Limited gardening knowledge
- **Goals:**
  - Family-friendly plants
  - Cost-effective solutions
  - Simple maintenance

---

## 4. Product Goals & Success Metrics

### 4.1 Business Goals
1. **Acquire** 10,000 active users in first 3 months
2. **Retain** 40% of users after 30 days
3. **Engage** users 2.5 times per week minimum
4. **Convert** 5% to premium features (Phase 2)

### 4.2 User Goals
1. **Identify** any plant within 3 seconds
2. **Save** plants from dying with timely reminders
3. **Diagnose** problems before it's too late
4. **Learn** simplified care in local context

### 4.3 Success Metrics (MVP - First 4 Weeks)

#### Week 1
- ✓ 100 organic app downloads
- ✓ 60% complete onboarding
- ✓ 3+ plants added per user
- ✓ 2-minute average session time

#### Week 4
- ✓ 500 total downloads
- ✓ 40% Week 1 retention
- ✓ 2.5 sessions per week average
- ✓ 50 Plant Doctor diagnoses
- ✓ 20 user feedback submissions
- ✓ 4.0+ app store rating

---

## 5. Feature Requirements

### 5.1 Feature Priority Matrix

| Priority | Feature | User Value | Dev Effort | MVP Status |
|----------|---------|-----------|------------|------------|
| P0 | Plant ID Camera | Critical | Medium | ✅ Week 1 |
| P0 | My Garden | Critical | Low | ✅ Week 1 |
| P0 | Care Reminders | Critical | Low | ✅ Week 2 |
| P1 | Plant Doctor | High | Medium | ✅ Week 3 |
| P2 | User Accounts | Medium | Medium | ❌ Phase 2 |
| P2 | Plant Encyclopedia | Medium | High | ❌ Phase 2 |
| P3 | Marketplace | Medium | Very High | ❌ Phase 3 |
| P3 | Social Features | Low | High | ❌ Phase 3 |

### 5.2 MVP Core Features (3 Weeks)

#### 5.2.1 Plant Identification Camera
**Purpose:** Hook users with instant value  
**User Story:** As a user, I want to identify my plant by taking a photo so I know how to care for it

**Acceptance Criteria:**
- [ ] Camera opens in < 1 second
- [ ] Auto-focus on plant
- [ ] Capture button clearly visible
- [ ] Photo can be retaken before submission
- [ ] Identification returns in < 3 seconds
- [ ] Shows Arabic + English names
- [ ] Displays confidence score
- [ ] Works with poor lighting
- [ ] Handles blurry images gracefully
- [ ] "Add to Garden" CTA prominent

**Technical Requirements:**
- OpenAI Vision API integration
- Image compression to < 500KB
- Offline fallback for common plants
- Support 25 Egyptian plants at launch

#### 5.2.2 My Garden
**Purpose:** Daily engagement driver  
**User Story:** As a user, I want to see all my plants in one place so I can track their care

**Acceptance Criteria:**
- [ ] Grid view (2 columns)
- [ ] Each plant shows:
  - [ ] User's photo
  - [ ] Nickname (editable)
  - [ ] Plant name (AR/EN)
  - [ ] Days since last watered
  - [ ] Health indicator (🟢🟡🔴)
- [ ] Add new plant button visible
- [ ] Pull to refresh
- [ ] Persists on app restart
- [ ] Quick actions: Water, Doctor, Delete
- [ ] Empty state for new users

**Technical Requirements:**
- Local storage with AsyncStorage
- Image caching
- Maximum 50 plants (MVP limit)

#### 5.2.3 Care Reminders
**Purpose:** Retention through notifications  
**User Story:** As a user, I want to be reminded when to water my plants so they don't die

**Acceptance Criteria:**
- [ ] Default reminder time: 8 AM Cairo time
- [ ] Adjustable time in settings
- [ ] Frequency based on:
  - [ ] Plant type requirements
  - [ ] Current temperature (weather API)
  - [ ] Season
- [ ] One-tap "Mark as Watered"
- [ ] Snooze option
- [ ] Works without opening app
- [ ] Bilingual notifications
- [ ] Groups multiple plants in one notification

**Technical Requirements:**
- Local notifications (no server needed)
- OpenWeather API for Cairo
- Background task scheduling
- Offline functionality

#### 5.2.4 Plant Doctor
**Purpose:** Viral/shareable feature  
**User Story:** As a user, I want to diagnose what's wrong with my sick plant so I can save it

**Acceptance Criteria:**
- [ ] Camera specifically for problems
- [ ] Guided photo tips
- [ ] Returns top 3 possible issues
- [ ] Each issue shows:
  - [ ] Problem name (simple language)
  - [ ] Confidence percentage
  - [ ] Visual symptoms
  - [ ] Solution steps (max 3)
- [ ] Save diagnosis to plant history
- [ ] Share diagnosis result
- [ ] "Problem solved" feedback option

**Technical Requirements:**
- Separate AI model for disease detection
- Common problems database
- Shareable result cards

---

## 6. User Journey

### 6.1 First-Time User Flow
```
1. App Launch
   → Splash screen (1s)
   → Welcome screen (Arabic/English choice)
   
2. Onboarding (Skippable)
   → "Keep your plants alive" (value prop)
   → "Take a photo to identify" (feature)
   → "Get care reminders" (feature)
   → Allow notifications prompt
   
3. First Plant
   → Camera opens automatically
   → Guided capture experience
   → AI identifies plant
   → Success animation
   → "Add to My Garden" CTA
   
4. Garden Setup
   → Name your plant (optional)
   → Set location (Balcony/Indoor/Garden)
   → First care reminder scheduled
   → Success state
   
5. Daily Use
   → Check garden
   → Receive reminders
   → Log care actions
   → Monitor health
```

### 6.2 Returning User Flow
```
1. Notification
   → "Your Pothos needs water!"
   → Tap to open app
   
2. Quick Action
   → Garden view opens
   → One-tap water logging
   → Success feedback
   
3. Browse
   → Check other plants
   → Use Plant Doctor if needed
   → Add new plants
```

---

## 7. Design Requirements

### 7.1 Design Principles
1. **Breathable** - Lots of white space, uncluttered
2. **Bilingual** - Arabic-first with English support  
3. **Botanical** - Natural, organic shapes and colors
4. **Simple** - Maximum 3 taps to any feature

### 7.2 Visual Identity
- **Primary Color:** Lotus Green (#2D5F3F)
- **Secondary Color:** Nile Blue (#4A90A4)
- **Background:** Cairo Sand (#F7F3E9)
- **Typography:** System fonts (performance)
- **Icons:** Outlined, 2px stroke
- **Border Radius:** 16px (cards), 24px (buttons)

### 7.3 Copy Guidelines
- **Tone:** Friendly friend, not expert
- **Language:** Simple, no jargon
- **Length:** Maximum 10 words per instruction
- **Emoji:** Use sparingly for delight

Examples:
- ❌ "Your Epipremnum aureum requires immediate hydration"
- ✅ "Your Pothos is thirsty! 💧"

---

## 8. Technical Requirements

### 8.1 Platform Support
- **iOS:** 13.0+ (covers 95% of Egyptian iOS users)
- **Android:** 6.0+ (covers 92% of Egyptian Android users)
- **Orientation:** Portrait only (MVP)
- **Offline:** Core features work without internet

### 8.2 Performance Requirements
- **App Size:** < 40MB (iOS), < 35MB (Android)
- **Launch Time:** < 2s cold start, < 0.5s warm
- **API Response:** < 3s for identification
- **Battery:** < 5% drain per hour active use
- **Memory:** < 200MB RAM usage

### 8.3 Data & Privacy
- **User Data:** Device ID only (no accounts in MVP)
- **Photo Storage:** Local device only
- **Analytics:** Anonymous usage metrics
- **Compliance:** Egyptian data protection laws

---

## 9. Constraints & Assumptions

### 9.1 Constraints
- **Timeline:** 3 weeks to MVP launch
- **Budget:** $0 (using free tiers/credits)
- **Team:** 1-2 developers
- **Scope:** Mobile only, no web
- **Language:** Arabic + English only

### 9.2 Assumptions
- Users have smartphones with cameras
- Users have intermittent internet access
- OpenAI API remains available
- Weather API free tier sufficient
- 25 plants covers 80% of use cases

### 9.3 Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| AI API downtime | Low | High | Offline fallback |
| Poor image quality | Medium | Medium | Guided capture |
| Low retention | Medium | High | Daily notifications |
| Negative reviews | Low | Medium | Beta testing |

---

## 10. Launch Strategy

### 10.1 Soft Launch (Week 1)
- **Audience:** 50 beta testers
- **Channels:** Friends, family, plant groups
- **Goals:** Bug fixes, initial feedback
- **Success:** 80% complete onboarding

### 10.2 Public Launch (Week 2-3)
- **Channels:** 
  - Facebook plant groups
  - Instagram plant influencers
  - WhatsApp gardening groups
- **PR Angle:** "First Arabic plant app"
- **Goals:** 500 downloads, 4.0+ rating

### 10.3 Growth Tactics
1. **Viral Features:**
   - Shareable plant IDs
   - Before/after plant photos
   - Plant Doctor diagnoses
   
2. **Retention Hooks:**
   - Daily care streaks
   - Plant health improvements
   - Weather-based tips

3. **Referral Incentive:**
   - "Save a friend's plant"
   - Unlock rare plant guides

---

## 11. Success Criteria

### 11.1 MVP Success (End of Week 4)
- [ ] 500+ total downloads
- [ ] 200+ active users
- [ ] 40% Day 7 retention
- [ ] 25% Day 30 retention
- [ ] 1000+ plants identified
- [ ] 100+ Plant Doctor uses
- [ ] 4.0+ App Store rating
- [ ] 20+ user testimonials
- [ ] 1 potential B2B lead

### 11.2 Go/No-Go Decision
**Continue to Phase 2 if:**
- Week 4 retention > 30%
- User feedback positive (NPS > 50)
- Technical foundation stable
- Clear monetization path identified

---

## 12. Future Roadmap

### Phase 2 (Month 2-3)
- User accounts & profiles
- Plant care encyclopedia  
- Achievements & gamification
- Premium features ($2.99/month)
- Social sharing features

### Phase 3 (Month 4-6)
- Marketplace MVP (browse only)
- Community features
- Expert consultations
- B2B nursery tools
- Regional expansion (Saudi, UAE)

### Phase 4 (Month 7-12)
- Full marketplace with transactions
- AI-powered growth tracking
- Augmented reality features
- Plant swap community
- Subscription tiers

---

## 13. Appendices

### A. 25 Launch Plants
**Indoor Plants:**
1. Pothos (البوتس)
2. Snake Plant (نبات الثعبان)
3. ZZ Plant (نبات زي زي)
4. Peace Lily (زنبق السلام)
5. Rubber Plant (نبات المطاط)
6. Monstera (مونستيرا)
7. Spider Plant (نبات العنكبوت)
8. Aloe Vera (الصبار)

**Balcony Plants:**
9. Jasmine (الياسمين)
10. Bougainvillea (الجهنمية)
11. Hibiscus (الكركديه)
12. Mint (النعناع)
13. Basil (الريحان)
14. Rosemary (إكليل الجبل)
15. Geranium (الخبيزة)

**Garden Plants:**
16. Rose (الورد)
17. Cactus (الصبار)
18. Olive Tree (شجرة الزيتون)
19. Lemon Tree (شجرة الليمون)
20. Date Palm (النخيل)
21. Ficus (فيكس)
22. Lavender (الخزامى)
23. Sage (المريمية)
24. Thyme (الزعتر)
25. Parsley (البقدونس)

### B. API Integrations
1. **OpenAI Vision API** - Plant identification
2. **OpenWeather API** - Cairo weather data
3. **Firebase** - Push notifications
4. **Mixpanel** - Analytics (free tier)

### C. Development Stack
- **Frontend:** React Native + TypeScript
- **State:** Zustand + React Query
- **Storage:** AsyncStorage + MMKV
- **Backend:** Node.js + Express (Phase 2)
- **Database:** PostgreSQL (Phase 2)

---

**Document Control:**
- **Author:** Product Team
- **Reviewers:** Engineering, Design
- **Approval:** Pending
- **Last Updated:** [Current Date]
- **Next Review:** Post Week 1 Launch

---

*This is a living document. Updates will be made based on user feedback and market learnings.*