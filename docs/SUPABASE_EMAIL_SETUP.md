# Supabase Email Template Configuration for Lotus

## 🌿 Lotus Plant Care App Email Templates

To customize the email templates for Lotus app, follow these steps in your Supabase dashboard:

### 1. Access Email Templates
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Settings** → **Email Templates**

### 2. Customize Confirmation Email Template

Replace the default confirmation email with this Lotus-branded template:

**Subject:** `Welcome to Lotus! 🌿 Please confirm your email`

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Lotus Plant Care</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #4CAF50, #8BC34A); padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 32px;">🌿 LOTUS</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your Personal Plant Care Companion</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
        <h2 style="color: #4CAF50; margin-top: 0;">Welcome to the Lotus Family! 🌱</h2>
        <p style="font-size: 16px;">We're excited to have you join our community of plant lovers in Cairo and beyond.</p>
        
        <p style="font-size: 16px;">With Lotus, you'll be able to:</p>
        <ul style="font-size: 15px; color: #555;">
            <li>🔍 Identify plants using your camera</li>
            <li>💧 Get Cairo weather-based watering recommendations</li>
            <li>📱 Track your plant care schedule</li>
            <li>🌡️ Receive local climate tips</li>
        </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ .ConfirmationURL }}" 
           style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-size: 16px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);">
            Confirm Your Email & Start Growing 🌿
        </a>
    </div>
    
    <div style="border-top: 2px solid #e9ecef; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #666; text-align: center;">
        <p>Perfect for Cairo's climate • Built for Egyptian plant lovers</p>
        <p>If you didn't create an account with Lotus, you can safely ignore this email.</p>
        <p style="margin-top: 15px;">
            <strong>Need help?</strong> Contact us at support@lotusplants.app
        </p>
    </div>
</body>
</html>
```

### 3. Customize Magic Link Email Template

**Subject:** `Sign in to Lotus 🌿 Your plants are waiting!`

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign in to Lotus Plant Care</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #4CAF50, #8BC34A); padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 32px;">🌿 LOTUS</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your Personal Plant Care Companion</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
        <h2 style="color: #4CAF50; margin-top: 0;">Welcome back! 🌱</h2>
        <p style="font-size: 16px;">Click the button below to sign in to your Lotus account and continue caring for your plants.</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ .ConfirmationURL }}" 
           style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-size: 16px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);">
            Sign In to Lotus 🌿
        </a>
    </div>
    
    <div style="border-top: 2px solid #e9ecef; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #666; text-align: center;">
        <p>Perfect for Cairo's climate • Built for Egyptian plant lovers</p>
        <p>If you didn't request this sign-in link, you can safely ignore this email.</p>
        <p style="margin-top: 15px;">
            <strong>Need help?</strong> Contact us at support@lotusplants.app
        </p>
    </div>
</body>
</html>
```

### 4. Customize Password Reset Email Template

**Subject:** `Reset your Lotus password 🔐 Get back to your plants!`

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Lotus Password</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #4CAF50, #8BC34A); padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 32px;">🌿 LOTUS</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your Personal Plant Care Companion</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
        <h2 style="color: #4CAF50; margin-top: 0;">Reset Your Password 🔐</h2>
        <p style="font-size: 16px;">We received a request to reset your Lotus account password. Click the button below to create a new password.</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ .ConfirmationURL }}" 
           style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-size: 16px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);">
            Reset Password 🔐
        </a>
    </div>
    
    <div style="border-top: 2px solid #e9ecef; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #666; text-align: center;">
        <p>Perfect for Cairo's climate • Built for Egyptian plant lovers</p>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
        <p style="margin-top: 15px;">
            <strong>Need help?</strong> Contact us at support@lotusplants.app
        </p>
    </div>
</body>
</html>
```

### 5. Configure Redirect URLs

In the same Authentication settings, configure these redirect URLs:

- **Site URL:** `exp://localhost:8081`
- **Redirect URLs:** 
  - `exp://localhost:8081`
  - `https://lotus-plant-care.netlify.app` (for web confirmation page)

### 6. Additional Settings

- **Enable Email Confirmations:** ✅ On
- **Enable Email Change Confirmations:** ✅ On
- **Secure Email Change:** ✅ On

## 🎯 Result

After applying these templates, users will receive:
- Beautifully branded emails mentioning "Lotus"
- Clear Cairo/Egypt context
- Professional styling matching the app design
- Clear call-to-action buttons
- Helpful support information

## 📱 Testing

Test the email flow by:
1. Creating a new account with email signup
2. Checking that the email arrives with Lotus branding
3. Clicking the confirmation link
4. Verifying the user gets logged in properly

---

**Note:** These templates will take effect immediately after saving in the Supabase dashboard.