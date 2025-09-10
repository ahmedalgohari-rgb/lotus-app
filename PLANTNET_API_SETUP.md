# 🌿 PlantNet API Setup Guide

## Getting Your Free PlantNet API Key

PlantNet offers a **free API** for plant identification with generous usage limits. Follow these steps to get your API key:

### Step 1: Create Account
1. Visit: [https://my.plantnet.org/](https://my.plantnet.org/)
2. Click "Sign Up" and create a free account
3. Verify your email address

### Step 2: Get API Key
1. Log in to your PlantNet account
2. Go to the "API" section in your dashboard
3. Your API key will be displayed - copy it

### Step 3: Configure App
1. Open `.env` file in your project root
2. Replace `YOUR_PLANTNET_API_KEY_HERE` with your actual API key:
```env
EXPO_PUBLIC_PLANTNET_API_KEY=your-actual-api-key-here
```

### Step 4: Test Integration
1. Restart your Expo development server
2. Use the plant scanner - it will now use real PlantNet identification
3. Check logs for successful API calls

## API Limits (Free Tier)
- **500 requests/day** - Perfect for development and testing
- **No credit card required**
- **Automatic reset daily**

## Supported Plant Types
PlantNet specializes in:
- Wild plants and flowers
- Trees and shrubs  
- Garden plants and houseplants
- European and Mediterranean flora

## Fallback System
The app is designed with a robust fallback system:
1. **PlantNet API** (primary)
2. **Local Egyptian Plants Database** (secondary)
3. **Generic Care Advice** (tertiary)

This ensures the app works even if:
- API key is missing
- Daily limits exceeded
- Network connectivity issues

## Production Deployment
For production apps with higher usage:
1. Consider PlantNet's paid plans for higher limits
2. Monitor usage through your PlantNet dashboard
3. Implement rate limiting in your app
4. Cache results to reduce API calls

## Troubleshooting
- **401 Unauthorized**: Check your API key is correct
- **429 Rate Limited**: You've exceeded daily limits
- **400 Bad Request**: Check image format and size (max 10MB)
- **No Results**: Try a clearer image or different angle