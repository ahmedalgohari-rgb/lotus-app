# Phase 1: Testing Checklist

**Date:** December 24, 2024
**Phase:** Remove Mock Fallbacks
**Tester:** [Your Name]
**Status:** Ready for Testing

---

## Pre-Testing Setup

- [ ] Code changes deployed to development environment
- [ ] App rebuilt and installed on test devices
- [ ] Test devices ready: iOS and Android
- [ ] PlantNet API key configured and working
- [ ] Test images prepared (plants + non-plants)

---

## Test Case 1: Not a Plant (Primary Test)

**Objective:** Verify non-plant photos show "Not a Plant" error instead of mock plants

### Test Photos:
- [ ] Photo of 3-year-old kid
- [ ] Photo of watch/smartwatch
- [ ] Photo of laptop keyboard
- [ ] Photo of coffee cup
- [ ] Photo of shoe
- [ ] Photo of book/text

### Expected Results:
- [ ] PlantNet API returns 404 or very low confidence
- [ ] Error message shows: "Not a Plant"
- [ ] Helpful tips displayed
- [ ] "Try Again" button works
- [ ] "View Tips" button navigates to tips
- [ ] **NO MOCK PLANT SHOWN** (Critical!)

### Actual Results:
```
Kid photo: _______________
Watch photo: ______________
Laptop photo: _____________
Cup photo: ________________
Shoe photo: _______________
Book photo: _______________
```

**Pass/Fail:** [ ]

---

## Test Case 2: Low Confidence Plant

**Objective:** Verify borderline plant photos show uncertainty UI

### Test Photos:
- [ ] Blurry plant photo
- [ ] Very small plant
- [ ] Plant in shadow
- [ ] Unusual plant angle
- [ ] Plant with unusual coloring

### Expected Results:
- [ ] Shows plant but <30% confidence triggers null return
- [ ] OR shows 30-60% confidence with uncertainty message
- [ ] Shows best guess species (if confidence ≥ 30%)
- [ ] Shows confidence percentage
- [ ] Offers "Try Again" or "Use This Anyway" (if applicable)
- [ ] Both buttons work correctly

### Actual Results:
```
Blurry plant: ______________
Small plant: _______________
Shadow plant: ______________
Angle plant: _______________
Unusual color: _____________
```

**Pass/Fail:** [ ]

---

## Test Case 3: Successful Identification

**Objective:** Verify clear plant photos work correctly

### Test Photos:
- [ ] Clear snake plant photo
- [ ] Clear monstera photo
- [ ] Clear succulent photo
- [ ] Clear cactus photo
- [ ] Clear flowering plant photo

### Expected Results:
- [ ] PlantNet identifies species correctly
- [ ] Shows species name and care tips
- [ ] Confidence > 30%
- [ ] NO ERROR SHOWN
- [ ] Navigation to result screen works

### Actual Results:
```
Snake plant: ______________
Monstera: _________________
Succulent: ________________
Cactus: ___________________
Flowering plant: __________
```

**Pass/Fail:** [ ]

---

## Test Case 4: Service Errors

**Objective:** Verify proper error handling for service issues

### Test Scenarios:
- [ ] Disconnect internet (network error)
- [ ] Use invalid API key (config error - requires code change)
- [ ] Rapid requests to trigger rate limit
- [ ] Simulate API down (if possible)

### Expected Results:
- [ ] Appropriate error message shown
- [ ] Error code displayed (e.g., "RATE_LIMITED", "API_ACCESS_DENIED")
- [ ] User guidance provided
- [ ] "Try Again" button available
- [ ] "Go Home" button available
- [ ] **NO MOCK FALLBACK CALLED**

### Actual Results:
```
Network error: _____________
Invalid key: _______________
Rate limit: ________________
API down: __________________
```

**Pass/Fail:** [ ]

---

## Test Case 5: Edge Cases

**Objective:** Test unusual scenarios

### Test Scenarios:
- [ ] Empty/blank photo
- [ ] Photo of printed plant picture
- [ ] Photo of plant drawing/painting
- [ ] Very dark photo (almost black)
- [ ] Very bright photo (overexposed)
- [ ] Photo with multiple plants

### Expected Results:
- [ ] App handles gracefully
- [ ] Shows appropriate error message
- [ ] No crashes
- [ ] No mock fallbacks

### Actual Results:
```
Empty photo: _______________
Printed picture: ___________
Drawing: ___________________
Dark photo: ________________
Bright photo: ______________
Multiple plants: ___________
```

**Pass/Fail:** [ ]

---

## Test Case 6: Error Recovery

**Objective:** Verify users can recover from errors

### Test Scenarios:
- [ ] Get "Not a Plant" error → "Try Again" → Take real plant photo
- [ ] Get service error → Wait → Try again
- [ ] Get low confidence → "Try Again" → Get better photo
- [ ] Get error → "Go Home" → Navigate elsewhere

### Expected Results:
- [ ] "Try Again" resets camera/screen
- [ ] Can successfully identify plant after error
- [ ] Navigation works correctly
- [ ] No stuck states

### Actual Results:
```
Try Again flow: ____________
Wait and retry: ____________
Better photo flow: _________
Go Home flow: ______________
```

**Pass/Fail:** [ ]

---

## Test Case 7: No Mock Fallbacks

**Objective:** Verify mock fallbacks are completely removed

### Verification Steps:
- [ ] Search code for `mockIdentify` → Should find ZERO references
- [ ] Search code for `MOCK FALLBACK` → Should find ZERO references
- [ ] Test all error scenarios → No mock plants appear
- [ ] Check TypeScript compilation → No errors

### Expected Results:
- [ ] No TypeScript errors about missing `mockIdentify`
- [ ] No "Use Mock Data" button in UI
- [ ] All tests pass without showing mock plants
- [ ] App builds successfully

### Actual Results:
```
Code search: _______________
Mock plants shown: _________
TypeScript errors: _________
Build status: ______________
```

**Pass/Fail:** [ ]

---

## Test Case 8: Translations

**Objective:** Verify error messages work in both English and Arabic

### Test Scenarios:
- [ ] Switch to English → Test "Not a Plant" error
- [ ] Switch to Arabic → Test "Not a Plant" error
- [ ] English → Test service error
- [ ] Arabic → Test service error
- [ ] English → Test low confidence error
- [ ] Arabic → Test low confidence error

### Expected Results:
- [ ] All error messages display correctly
- [ ] Tips show in correct language
- [ ] Buttons have correct labels
- [ ] No missing translations
- [ ] Text is readable and makes sense

### Actual Results:
```
English errors: ____________
Arabic errors: _____________
Missing translations: ______
```

**Pass/Fail:** [ ]

---

## Performance Testing

### Metrics to Track:
- [ ] Time to show error (should be <1 second)
- [ ] Memory usage (no leaks)
- [ ] App doesn't freeze or lag
- [ ] PlantNet API response time
- [ ] Rate limiting works correctly (10 requests/hour)

### Actual Results:
```
Error display time: ________
Memory usage: ______________
App performance: ___________
API response time: _________
Rate limiting: _____________
```

**Pass/Fail:** [ ]

---

## Regression Testing

**Objective:** Ensure existing functionality still works

### Features to Test:
- [ ] Manual plant addition (without scan)
- [ ] Plant library browsing
- [ ] Plant care tips display
- [ ] User authentication
- [ ] Settings and preferences
- [ ] Plant watering reminders (if applicable)

### Expected Results:
- [ ] All existing features work as before
- [ ] No new bugs introduced
- [ ] UI still looks good
- [ ] Navigation works correctly

### Actual Results:
```
Manual add: ________________
Library: ___________________
Care tips: _________________
Auth: ______________________
Settings: __________________
Reminders: _________________
```

**Pass/Fail:** [ ]

---

## Final Verification

- [ ] All critical tests passed
- [ ] All high-priority tests passed
- [ ] No "Monstera Deliciosa" shown for kid photos
- [ ] No "Golden Pothos" shown for laptop photos
- [ ] PlantNet API working correctly
- [ ] Error messages are user-friendly
- [ ] App is stable and doesn't crash
- [ ] Ready for production deployment

---

## Summary

**Total Tests:** _____ / _____
**Pass Rate:** _____%
**Critical Failures:** _____
**Blockers:** _____

**Recommendation:**
- [ ] ✅ Ready for Production
- [ ] ⚠️ Ready with Minor Issues
- [ ] ❌ Not Ready - Critical Issues Found

**Notes:**
```
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
```

---

## Tester Sign-off

**Tested By:** ___________________________
**Date:** ___________________________
**Signature:** ___________________________

---

**Next Steps:**
1. Fix any critical issues found
2. Re-test failed cases
3. Get stakeholder approval
4. Deploy to staging for final validation
5. Deploy to production (canary rollout)
