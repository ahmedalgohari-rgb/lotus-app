# Facebook OAuth Setup Guide

## ⚠️ Important Note
Facebook OAuth is currently **NOT configured** in your Supabase dashboard, which is why you're seeing the "Invalid app ID" error. Follow these steps to set it up.

---

## Step 1: Create Facebook App

### 1.1 Go to Facebook Developers Console
Visit: [https://developers.facebook.com/](https://developers.facebook.com/)

### 1.2 Create New App
1. Click "Create App" button
2. Select app type: **"Consumer"**
3. Fill in app details:
   - **App Name:** Lotus - Plant Care App
   - **App Contact Email:** Your email
   - **Business Account:** (Optional - can skip)
4. Click "Create App"

### 1.3 Add Facebook Login Product
1. In the Facebook App dashboard, find "Add a Product"
2. Locate **"Facebook Login"** and click "Set Up"
3. Select platform: **"iOS"** (or both iOS and Android)

---

## Step 2: Configure Facebook Login Settings

### 2.1 Add OAuth Redirect URIs
1. Go to **Facebook Login → Settings** (left sidebar)
2. Scroll to **"Valid OAuth Redirect URIs"**
3. Add these URLs (one per line):
   ```
   https://pitcghqftgamgsduqgbr.supabase.co/auth/v1/callback
   lotus://auth/callback
   com.lotus.plantcare://auth/callback
   ```
4. Click "Save Changes"

### 2.2 Enable Settings
Make sure these are enabled:
- ✅ **Client OAuth Login:** Yes
- ✅ **Web OAuth Login:** Yes
- ✅ **Enforce HTTPS:** Yes (for production)
- ✅ **Use Strict Mode for Redirect URIs:** Yes

---

## Step 3: Get Facebook App Credentials

### 3.1 App ID and Secret
1. Go to **Settings → Basic** (left sidebar)
2. You'll see:
   - **App ID:** `XXXXXXXXXXXX` (copy this)
   - **App Secret:** Click "Show" then copy the secret

### 3.2 Save Credentials Securely
**DO NOT** commit these to Git!

---

## Step 4: Configure Supabase

### 4.1 Add Facebook Provider
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your **Lotus** project
3. Navigate to: **Authentication → Providers**
4. Find **"Facebook"** in the list
5. Click to expand Facebook settings

### 4.2 Enter Facebook Credentials
1. **Enable Facebook provider:** Toggle to ON
2. **Facebook App ID:** Paste the App ID from Step 3.1
3. **Facebook App Secret:** Paste the App Secret from Step 3.1
4. **Authorized Client IDs:** (Leave empty - not needed)
5. Click **"Save"**

### 4.3 Verify Redirect URL
Supabase will show you the redirect URL to use:
```
https://pitcghqftgamgsduqgbr.supabase.co/auth/v1/callback
```

Make sure this **matches exactly** with the URL you added in Facebook (Step 2.1)!

---

## Step 5: Test Facebook OAuth

### 5.1 Test on Real Device
1. Open your Lotus app on your **physical iPhone**
2. Navigate to the Auth screen
3. Tap **"Continue with Facebook"**
4. Browser should open with Facebook login
5. Log in with your Facebook account
6. Browser should redirect back to the app
7. You should be logged in! ✅

### 5.2 Check Logs
You should see in the console:
```
🔐 Facebook Sign-In Flow
🔍 DEBUG: Initiating Facebook OAuth...
🔍 DEBUG: Opening Facebook OAuth browser with URL: ...
🔍 DEBUG: Facebook OAuth browser returned successfully
🔍 DEBUG: Polling for session (max 10 seconds)...
🔍 DEBUG: Session found after XXXms
🔍 DEBUG: Facebook OAuth successful, session retrieved
✅ SUCCESS: User authenticated
```

---

## Step 6: Submit for Review (Production Only)

**For Development:** The app works for admins, developers, and testers automatically.

**For Production (public release):**
1. Facebook requires **App Review** before public users can log in
2. Go to **App Review → Permissions and Features**
3. Request these permissions:
   - ✅ **email** (usually approved automatically)
   - ✅ **public_profile** (usually approved automatically)
4. Provide:
   - App screenshots
   - Privacy policy URL
   - Detailed description of how Facebook Login is used
5. Submit for review (takes 1-3 days)

---

## Troubleshooting

### Error: "Invalid app ID"
**Cause:** Facebook provider not configured in Supabase
**Fix:** Complete Step 4 above

### Error: "Redirect URI mismatch"
**Cause:** The redirect URL in Facebook doesn't match Supabase's callback URL
**Fix:**
1. Check Facebook Login Settings → Valid OAuth Redirect URIs
2. Ensure this URL is added: `https://pitcghqftgamgsduqgbr.supabase.co/auth/v1/callback`

### Error: "App not set up"
**Cause:** Facebook Login product not added to Facebook App
**Fix:** Add Facebook Login product (Step 1.3)

### Error: "The app is not live"
**Cause:** App is in Development Mode
**Fix:**
- For testing: Add your Facebook account as a tester in **Roles → Test Users**
- For production: Submit app for review (Step 6)

### OAuth completes but user not logged in
**Cause:** Session not being set correctly
**Fix:** This is now fixed with the polling mechanism we implemented

---

## Development Mode Testing

### Add Test Users
1. Go to **Roles → Roles** in Facebook App dashboard
2. Click "Add Testers"
3. Enter Facebook user IDs or invite by email
4. Test users can use Facebook Login without app review

### Add Your Account
1. Go to **Roles → Administrators**
2. Your account (app creator) is automatically an admin
3. Admins can always test Facebook Login

---

## Security Best Practices

### 1. Keep App Secret Secure
- ✅ Never commit App Secret to Git
- ✅ Only store in Supabase dashboard (server-side)
- ✅ Never expose in client-side code

### 2. Use HTTPS in Production
- ✅ Enable "Enforce HTTPS" in Facebook Login Settings
- ✅ Use secure redirect URLs only

### 3. Limit Permissions
- ✅ Only request `email` and `public_profile`
- ❌ Don't request unnecessary permissions

---

## Summary Checklist

Before Facebook OAuth will work:

- [ ] Created Facebook App on developers.facebook.com
- [ ] Added Facebook Login product
- [ ] Added 3 redirect URLs to Facebook Login Settings
- [ ] Copied App ID and App Secret
- [ ] Enabled Facebook provider in Supabase dashboard
- [ ] Entered App ID and Secret in Supabase
- [ ] Verified redirect URL matches exactly
- [ ] Tested on real device
- [ ] Confirmed logs show "session found"
- [ ] User successfully logged in with Facebook

---

## Additional Resources

- [Facebook Login for iOS Guide](https://developers.facebook.com/docs/facebook-login/ios)
- [Supabase Facebook OAuth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-facebook)
- [Facebook App Review Process](https://developers.facebook.com/docs/app-review)

---

**Last Updated:** 2025-11-09
**Status:** Pending Configuration
**Priority:** Medium (Google OAuth works, Facebook is optional)
