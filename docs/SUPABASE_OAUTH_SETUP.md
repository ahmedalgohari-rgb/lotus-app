# Supabase OAuth & Email Setup Guide for Lotus 🌿

## 🚨 Critical Setup Required

The OAuth providers (Google/Apple) and email confirmations need proper configuration in your Supabase dashboard.

## 1. OAuth Providers Setup

### Google OAuth Configuration

1. **Go to Supabase Dashboard** → Your Project → Authentication → Settings → Auth Providers

2. **Enable Google Provider**:
   - Toggle **Google Enabled** to ON
   - Get Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 Client ID for iOS application
   - Add your Client ID and Client Secret to Supabase

3. **Configure Redirect URLs**:
   ```
   Authorized redirect URIs:
   - https://[your-project-id].supabase.co/auth/v1/callback
   - exp://localhost:8081
   - exp://localhost:8082
   - exp://localhost:8083
   ```

### Apple OAuth Configuration

1. **Enable Apple Provider** in Supabase:
   - Toggle **Apple Enabled** to ON
   - Set up Apple Developer Account
   - Create App ID and Services ID
   - Add credentials to Supabase

2. **Apple Developer Setup**:
   - Go to [Apple Developer Portal](https://developer.apple.com/account/)
   - Configure Sign in with Apple
   - Add return URLs matching Supabase callback

## 2. Email Template Configuration

Follow the `SUPABASE_EMAIL_SETUP.md` file to set up branded email templates.

## 3. Development Testing

For development and testing, you can:

1. **Use Guest Mode**: Always works without configuration
2. **Use Email Sign-up**: Works but needs email templates configured
3. **Test OAuth**: Requires full production setup

## 4. Current App Behavior

The app now includes better error handling:

- **OAuth buttons** will show helpful error messages if not configured
- **Email signup** will show confirmation message and return to auth screen
- **Guest mode** continues to work perfectly for testing

## 5. Quick Test

To test the fixes:

1. **Homepage Scrolling**: 
   - Navigate to home screen
   - Scroll down to see all content including Cairo weather
   - Should now scroll past the bottom with proper padding

2. **OAuth Testing**:
   - Try Google/Apple sign-in
   - Check Metro logs for configuration warnings
   - Use guest mode for immediate access

3. **Email Testing**:
   - Try email signup
   - Check email for branded Lotus message (after template setup)
   - Confirmation should work properly

## 6. Production Deployment

For production deployment:
- Complete OAuth provider setup
- Configure proper domain redirects
- Test all flows thoroughly
- Set up proper error monitoring

---

**Note**: OAuth setup is complex and typically takes 1-2 hours to configure properly. Guest mode and email signup provide immediate alternatives for testing the app functionality.