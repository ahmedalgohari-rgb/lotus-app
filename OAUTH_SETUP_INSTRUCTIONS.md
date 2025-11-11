# OAuth Setup Instructions for Lotus App

## 📱 Required Supabase Redirect URLs

After updating the OAuth implementation, you **MUST** add these redirect URLs to your Supabase project for OAuth to work correctly.

### Where to Add These URLs:

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your **Lotus** project
3. Navigate to: **Authentication** → **URL Configuration**
4. Scroll to **Redirect URLs** section
5. Add each of the following URLs (one per line):

```
lotus://auth/callback
com.lotus.plantcare://auth/callback
exp+lotus-app://auth/callback
```

### Why These URLs?

- **`lotus://auth/callback`** - Primary deep link scheme for production
- **`com.lotus.plantcare://auth/callback`** - Bundle identifier scheme (iOS/Android)
- **`exp+lotus-app://auth/callback`** - Expo development scheme

---

## 🔐 OAuth Provider Configuration

### Current OAuth Flow:

1. **User taps "Continue with Google/Facebook"**
2. **App opens OAuth browser** (using expo-web-browser)
3. **User logs in** on provider's website
4. **Provider redirects back** to app using deep link (`lotus://auth/callback`)
5. **App processes session** and logs user in

### Redirect URL Format:

The app uses:
```typescript
const redirectTo = makeRedirectUri({
  scheme: 'lotus',
  path: 'auth/callback',
});
```

This generates: `lotus://auth/callback`

---

## ✅ Verification Checklist

After adding the redirect URLs to Supabase:

- [ ] Added all 3 redirect URLs to Supabase dashboard
- [ ] Google OAuth credentials configured in Supabase
- [ ] Facebook OAuth credentials configured in Supabase
- [ ] Apple OAuth credentials configured (optional - currently disabled in UI)
- [ ] Saved changes in Supabase dashboard
- [ ] Tested OAuth on physical device (not just simulator)

---

## 🧪 Testing OAuth

### On Physical Device (Recommended):

1. Open the app on your iPhone
2. Tap "Continue with Google"
3. Browser should open with Google login
4. After login, you should be redirected back to the app
5. Check logs for: `✅ Google OAuth successful, session retrieved`

### Common Issues:

**Issue**: "Invalid redirect URL" error from Supabase
- **Fix**: Verify you added the exact URLs above to Supabase dashboard

**Issue**: Browser opens but doesn't redirect back
- **Fix**: Check that app scheme `lotus://` is registered in `app.json`

**Issue**: "No session found after OAuth completion"
- **Fix**: Check that deep link handler in `App.tsx` is working correctly

---

## 📝 Provider-Specific Notes

### Google OAuth:
- Requires OAuth 2.0 Client ID from Google Cloud Console
- Add to Supabase: Authentication → Providers → Google
- Scopes requested: `offline_access`, `consent`

### Facebook OAuth:
- Requires Facebook App ID and App Secret
- Add to Supabase: Authentication → Providers → Facebook
- Scopes requested: `email`, `public_profile`

### Apple OAuth (Future):
- Requires Apple Developer Account
- Add to Supabase: Authentication → Providers → Apple
- Currently disabled in UI ("Coming Soon" badge)

---

## 🔧 Deep Link Configuration

The app's deep link scheme is configured in:

**File**: `/Users/ahmedalgohari/Lotus/app.json`

```json
{
  "expo": {
    "scheme": "lotus",
    "bundleIdentifier": "com.lotus.plantcare"
  }
}
```

**Deep Link Handler**: `/Users/ahmedalgohari/Lotus/App.tsx` (lines 36-90)
- Listens for `lotus://` URLs
- Extracts `access_token` and `refresh_token`
- Sets Supabase session
- Authenticates user

---

## 🚀 What Changed (Technical Details)

### Before (Broken):
```typescript
// ❌ This didn't work - returned OAuth URL, not user data
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo },
});
return { data, error }; // data.user was undefined!
```

### After (Fixed):
```typescript
// ✅ Now opens browser and waits for session
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo,
    skipBrowserRedirect: true, // We handle browser manually
  },
});

// Open browser with OAuth URL
const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

// Wait for deep link callback to set session
await new Promise(resolve => setTimeout(resolve, 1500));

// Get the actual session
const { data: sessionData } = await supabase.auth.getSession();
return { data: { user: sessionData.session?.user }, error: null };
```

---

## 📞 Need Help?

If OAuth still doesn't work after following these steps:

1. **Check Supabase logs**: Authentication → Logs
2. **Check app logs**: Look for `🔐 Google Sign-In Flow` or `🔐 Facebook Sign-In Flow`
3. **Verify redirect URLs**: Make sure they match exactly (no trailing slashes)
4. **Test on real device**: OAuth doesn't always work correctly in simulators

---

**Last Updated**: 2025-11-08
**OAuth Implementation**: `src/services/supabase.ts`
**Deep Link Handler**: `App.tsx`
