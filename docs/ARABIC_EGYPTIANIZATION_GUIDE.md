# 🇪🇬 Arabic Egyptianization Guide

**Status**: Reference document for future Arabic translation overhaul
**Goal**: Transform formal Modern Standard Arabic (MSA) to friendly Egyptian Colloquial Arabic (ECA)

---

## 📋 BEFORE → AFTER Comparison Table

| **Category** | **Location (JSON Key)** | **❌ BEFORE (Formal MSA)** | **✅ AFTER (Egyptian)** | **Why Change?** |
|-------------|------------------------|---------------------------|------------------------|-----------------|
| **🏠 PAGE TITLES** |
| Navigation | `navigation.profile` | الملف الشخصي | **حسابي** | More natural |
| Scan | `scan.subtitle` | وجه الكاميرا على ورقة الزرعة | **صور ورق النبات** | Direct instruction |
| | | | | |
| **📊 SECTIONS & CONCEPTS** |
| Plant Detail | `plantDetail.careHistory` | تاريخ العناية | **تاريخ العناية** | Conversational |
| Plant Detail | `plantDetail.careSchedule` | جدول العناية | **مواعيد العناية** | Less formal |
| Plant Detail | `plantDetail.quickActions` | إجراءات سريعة | **إجراءات سريعة** | Egyptian colloquial |
| Plant Detail | `plantDetail.careActions` | أعمال العناية | **أعمال العناية** | Question = friendly |
| Plant Detail | `plantDetail.plantInfo` | معلومات الزرعة | **معلومات النبات** | Warmer, possessive |
| Plant Detail | `plantDetail.plantDetails` | تفاصيل النبات | **تفاصيل النبات** | Add possessive |
| Care | `care.smartRecommendations` | توصيات ذكية | **توصيات** | More friendly |
| | | | | |
| **⚡ ACTION BUTTONS** |
| Scan | `scan.addToCollection` | ضيف لنباتاتي | **ضيف لنباتاتي** | Casual |
| Add Plant | `addPlant.saveToCollection` | احفظ في حديقتي | **احفظها في حديقتي** | Add pronoun |
| Plants | `plants.actions.waterAll` | اسقي الكل | **اسقي الكل** | Colloquial |
| Plants | `plants.actions.addNew` | ضيف نبات جديد | **ضيف نبات جديد** | Ta marbuta (ة) |
| Common | `common.retry` | حاول تاني | **جرب تاني** | Consistency |
| Common | `common.success` | تم بنجاح | **تمام!** | Short, friendly |
| | | | | |
| **🗓️ TIME & SCHEDULING** |
| Plant Detail | `plantDetail.nextWatering` | الري الجاي | **الري الجاي** | Natural question |
| Plant Detail | `plantDetail.lastWatered` | آخر ري | **آخر ري** | Past tense natural |
| | | | | |
| **📍 LOCATIONS** |
| Add Plant | `addPlant.locations.living_room` | أوضة المعيشة | **الصالون** | Egyptian term |
| | | | | |
| **💬 MESSAGES & FEEDBACK** |
| Add Plant | `addPlant.plantAddedTitle` | تمت الإضافة! 🌿 | **اتضافت! 🌿** | Egyptian past tense |
| Plant Detail | `plantDetail.careRecorded` | تم تسجيل العناية بنجاح | **تمام، اتسجلت!** | Casual |
| Plant Detail | `plantDetail.confirmDelete` | متأكد إنك عايز تحذف الزرعة دي؟ | **متأكد إنك عايز تحذفها؟** | Add object pronoun |
| | | | | |
| **🌤️ WEATHER** |
| Home | `home.weatherTitle` | الجو إيه في القاهرة النهاردة | **الجو إيه النهاردة؟** | Cairo implied |
| | | | | |
| **📝 FORMS & INPUT** |
| Add Plant | `addPlant.plantNickname` | اسم الزرعة | **اسم نبتتك** | Possessive |
| Add Plant | `addPlant.enterNickname` | ادخل اسم لزرعتك | **حب تسميها إيه؟** | Question = conversational |
| Add Plant | `addPlant.plantLocation` | موقع الزرعة | **مكان النبتة** | Simpler |
| Add Plant | `addPlant.windowDirection` | اتجاه الشباك | **الشباك ناحية فين؟** | Question format |
| | | | | |
| **🎯 STATUS & STATES** |
| Plants | `plants.critical` | حالة خطيرة | **في خطر** | Less alarming |
| | | | | |
| **🔐 AUTH & ACCOUNT** |
| Auth | `auth.subtitle` | رفيقك في العناية بالنباتات في البيت | **صاحبك في الاهتمام بنباتاتك** | "صاحبك" warmer |
| Auth | `auth.signInWithGoogle` | دخول بجوجل | **ادخل بجوجل** | Imperative simpler |
| Auth | `auth.continueAsGuest` | استمر كضيف | **كمل بدون حساب** | Clearer |
| Auth | `auth.guestMode` | وضع الضيف | **بدون حساب** | Simpler |
| | | | | |
| **❌ ERRORS** |
| Errors | `errors.networkError` | مشكلة في النت. شيك على الاتصال. | **مفيش نت** | Direct, Egyptian |
| Errors | `errors.imageError` | مشكلة في معالجة الصورة | **مشكلة في الصورة** | Simpler |
| Errors | `errors.cameraError` | مشكلة في الكاميرا | **مشكلة في الكاميرا** | Conversational |
| Scan | `scan.analyzing` | جاري تحليل الزرعة... | **بنعرف النبات...** | Personal, active |
| Scan | `scan.identificationResults` | تم تحديد الزرعة! | **عرفناها!** | Short, excited |
| | | | | |
| **🌿 CARE ACTIONS** |
| Plant Detail | `plantDetail.water` | ري | **ري** | Verb = actionable |
| Plant Detail | `plantDetail.feed` | تغذية | **غذى** | Simpler |
| Plant Detail | `plantDetail.fertilize` | تسميد | **سمد** | Verb form |
| Plant Detail | `plantDetail.prune` | تقليم | **قلم** | Verb form |
| Plant Detail | `plantDetail.repot` | نقل إصيص | **تغيير إصيص** | Clearer |
| | | | | |
| **🎓 TIPS & GUIDES** |
| Tips | `tips.light.description` | ضوء مشرق غير مباشر مناسب لمعظم النباتات | **ضوء قوي بس مش مباشر** | Simpler |

---

## ✅ Already Perfect (Keep As-Is) - i updated few words manually so check these too"

These are already in Egyptian colloquial - **no changes needed**:

| **Key** | **Text** | **Why It's Good** |
|---------|----------|-------------------|
| `navigation.home` | البيت | Egyptian for "home" ✅ |
| `navigation.scan` | صور | Imperative "take photo" ✅ |
| `navigation.plants` | حديقتي | "My garden" ✅ |
| `home.welcomeFirst` | أهلا يا | Warm greeting ✅ |
| `home.plantsNeedCare` | النباتات دي عايزة اهتمام | "دي" + "عايزة" = Egyptian ✅ |
| `home.careReminders` | اللي لازم تعمله النهاردة | Perfect Egyptian phrase ✅ |
| `home.seasonalTips` | نصايح موسمية | Good mix ✅ |
| `addPlant.whereWillPlantLive` | زرعتك هتعيش فين؟ | "هتعيش فين" perfect ✅ |
| `addPlant.directions.north` | بحري | Egyptian directional ✅ |
| `addPlant.directions.south` | قبلي | Egyptian directional ✅ |
| `common.ok` | تمام | Egyptian confirmation ✅ |
| `scan.noResults` | معرفناش الزرعة دي | "معرفناش" Egyptian ✅ |
| `plants.noPlantsTitle` | لسه مافيش نباتات | "لسه" Egyptian ✅ |
| `weather.hot` | حر | Simple, Egyptian ✅ |
| `weather.warm` | دافي | Egyptian ✅ |
| `weather.dry` | جاف | Egyptian colloquial ✅ |
| `plantDetail.now` | دلوقتي! | Egyptian "now" ✅ |
| `plantDetail.tomorrow` | بكرة | Egyptian "tomorrow" ✅ |
| `plantResult.plantStory` | قصة نباتك | Already good ✅ |
| `care.weatherBasedCare` | حسب جو النهاردة | Already perfect ✅ |

---

## 🎯 TOP 15 PRIORITY CHANGES

Most visible/impactful changes (do these first):

1. ✏️ `plantDetail.careHistory`: تاريخ العناية → **تاريخ العناية**
2. ✏️ `plantDetail.careSchedule`: جدول العناية → **مواعيد العناية**
3. ✏️ `plantDetail.quickActions`: إجراءات سريعة → **إجراءات سريعة**
4. ✏️ `plantDetail.careActions`: أعمال العناية → **أعمال العناية**
5. ✏️ `plantDetail.nextWatering`: الري الجاي → **الري الجاي**
6. ✏️ `plantDetail.plantInfo`: معلومات الزرعة → **معلومات عن نباتك**
7. ✏️ `scan.addToCollection`: ضيف لنباتاتي → **ضيف لنباتاتي**
8. ✏️ `addPlant.locations.living_room`: أوضة المعيشة → **الصالون**
9. ✏️ `addPlant.enterNickname`: ادخل اسم لزرعتك → **دخل اسم لنباتك**
10. ✏️ `addPlant.windowDirection`:اتجاه الشباك → **اتجاه الشباك**
11. ✏️ `auth.subtitle`: رفيقك في العناية بالنباتات في البيت → **رفيقك في الاهتمام بنباتاتك**
12. ✏️ `auth.continueAsGuest`: استمر كضيف → **كمل بدون حساب**
13. ✏️ `errors.networkError`: مشكلة في النت. شيك على الاتصال. → **مفيش نت**
14. ✏️ `errors.cameraError`: مشكلة في الكاميرا → **الكاميرا مش شغالة**
15. ✏️ `scan.analyzing`: جاري تحليل الزرعة... → **بنعرف النبات...**

---

## 🎨 Egyptian Arabic Patterns Applied

### 1. **Question Format** (More Conversational)
```
❌ ادخل اسم لزرعتك
✅ دخل اسم لنباتك
```

### 2. **Possessive Pronouns** (Creates Connection)
```
❌ معلومات الزرعة
✅ كل حاجة عن نباتك
```

### 3. **Verb Forms** (More Actionable)
```
❌ ري
✅ ري
```

### 4. **Colloquial Terms** (Warmer Tone)
```
❌ رفيقك
✅ رفيقك
```

### 5. **Simplicity** (Direct Communication)
```
❌ مشكلة في الشبكة
✅ مفيش نت
```

### 6. **Active Voice** (More Engaging)
```
❌ جاري تحليل الزرعة
✅ بنعرف النبات
```

---

## 📊 Statistics

- **Total keys in ar.json**: ~200+
- **Suggested changes**: ~40 keys
- **Already perfect**: ~20 keys
- **Impact**: Transforms tone from "formal manual" to "friendly assistant"
- **Target audience**: Egyptian millennials/Gen-Z (daily ECA speakers)

---

## 🚀 Implementation Plan

### Phase 1: Quick Wins (Top 15 Priority)
Focus on most visible/frequent terms in main user flows:
- Plant detail screen (7 changes)
- Add plant flow (3 changes)
- Auth screens (2 changes)
- Error messages (3 changes)

### Phase 2: Full Overhaul (~40 changes)
Apply all suggestions from the main comparison table

### Phase 3: User Testing
- Get feedback from Egyptian beta testers
- A/B test controversial changes
- Refine based on actual usage

---

## 💡 Notes for Implementation

1. **File location**: `/src/i18n/locales/ar.json`
2. **Testing**: Switch app language to Arabic and navigate through all screens
3. **Consistency**: After changes, ensure tone is consistent across app
4. **Edge cases**: Check pluralization rules still work (e.g., "يوم" vs "أيام")
5. **Length**: Egyptian phrases may be longer/shorter - test UI layouts

---

## 🔍 Quick Search Guide

Use this to find keys in `ar.json`:

```bash
# Search for a specific key
grep -n "careHistory" src/i18n/locales/ar.json

# Search for Arabic text
grep -n "تاريخ العناية" src/i18n/locales/ar.json

# View full context around line 152
sed -n '150,155p' src/i18n/locales/ar.json
```

---

**Last Updated**: 2026-02-08
**Status**: Ready for review and implementation
