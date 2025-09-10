/**
 * OAuth Service
 * Handles Google and Apple Sign-In integration
 */

import { Alert } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { User } from '@/store';

export interface OAuthResult {
  success: boolean;
  user?: User;
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
  error?: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

class OAuthService {
  private googleConfig = {
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  };

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<OAuthResult> {
    try {
      // Configure Google sign-in
      const [request, response, promptAsync] = Google.useAuthRequest({
        iosClientId: this.googleConfig.iosClientId,
        androidClientId: this.googleConfig.androidClientId,
        webClientId: this.googleConfig.webClientId,
        scopes: ['profile', 'email'],
      });

      if (!request) {
        return {
          success: false,
          error: 'Failed to initialize Google sign-in',
        };
      }

      // Prompt user to sign in
      const result = await promptAsync();

      if (result.type === 'success') {
        // Get user info from Google
        const userInfo = await this.getGoogleUserInfo(result.authentication?.accessToken);
        
        if (!userInfo) {
          return {
            success: false,
            error: 'Failed to get user information',
          };
        }

        // Create user object
        const user: User = {
          id: userInfo.id,
          email: userInfo.email,
          firstName: userInfo.given_name,
          lastName: userInfo.family_name,
          provider: 'google',
          preferences: {
            language: userInfo.locale?.startsWith('ar') ? 'ar' : 'en',
            notifications: true,
            measurementUnit: 'metric',
          },
          createdAt: new Date().toISOString(),
          avatarUrl: userInfo.picture,
        };

        // Exchange token with backend (mock for now)
        const tokens = await this.exchangeGoogleToken(result.authentication?.accessToken || '');

        return {
          success: true,
          user,
          tokens,
        };
      } else if (result.type === 'cancel') {
        return {
          success: false,
          error: 'User cancelled sign-in',
        };
      } else {
        return {
          success: false,
          error: 'Google sign-in failed',
        };
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      return {
        success: false,
        error: 'An error occurred during Google sign-in',
      };
    }
  }

  /**
   * Sign in with Apple
   */
  async signInWithApple(): Promise<OAuthResult> {
    try {
      // Check if Apple Authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      
      if (!isAvailable) {
        return {
          success: false,
          error: 'Apple Sign-In is not available on this device',
        };
      }

      // Generate nonce for security
      const nonce = Math.random().toString(36).substring(2, 10);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce,
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      // Request Apple authentication
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (credential) {
        // Create user object
        const user: User = {
          id: credential.user,
          email: credential.email || `${credential.user}@privaterelay.appleid.com`,
          firstName: credential.fullName?.givenName || 'User',
          lastName: credential.fullName?.familyName || '',
          provider: 'apple',
          preferences: {
            language: 'en', // Default to English, can be updated in settings
            notifications: true,
            measurementUnit: 'metric',
          },
          createdAt: new Date().toISOString(),
        };

        // Exchange token with backend (mock for now)
        const tokens = await this.exchangeAppleToken(credential.identityToken || '');

        return {
          success: true,
          user,
          tokens,
        };
      } else {
        return {
          success: false,
          error: 'Apple sign-in was cancelled',
        };
      }
    } catch (error: any) {
      console.error('Apple sign-in error:', error);
      
      if (error.code === 'ERR_CANCELED') {
        return {
          success: false,
          error: 'User cancelled Apple sign-in',
        };
      }
      
      return {
        success: false,
        error: 'An error occurred during Apple sign-in',
      };
    }
  }

  /**
   * Get Google user information
   */
  private async getGoogleUserInfo(accessToken?: string): Promise<GoogleUserInfo | null> {
    if (!accessToken) return null;

    try {
      const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        return await response.json();
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get Google user info:', error);
      return null;
    }
  }

  /**
   * Exchange Google token with backend
   */
  private async exchangeGoogleToken(googleToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Mock implementation - replace with actual backend call
    try {
      // const response = await fetch('/api/auth/google', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ token: googleToken }),
      // });
      
      // Mock tokens for development
      return {
        accessToken: `mock_access_token_${Date.now()}`,
        refreshToken: `mock_refresh_token_${Date.now()}`,
      };
    } catch (error) {
      console.error('Token exchange error:', error);
      throw new Error('Failed to exchange token');
    }
  }

  /**
   * Exchange Apple token with backend
   */
  private async exchangeAppleToken(appleToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Mock implementation - replace with actual backend call
    try {
      // const response = await fetch('/api/auth/apple', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ token: appleToken }),
      // });
      
      // Mock tokens for development
      return {
        accessToken: `mock_access_token_${Date.now()}`,
        refreshToken: `mock_refresh_token_${Date.now()}`,
      };
    } catch (error) {
      console.error('Token exchange error:', error);
      throw new Error('Failed to exchange token');
    }
  }

  /**
   * Show OAuth error alert
   */
  showOAuthError(error: string, provider: 'google' | 'apple'): void {
    const providerName = provider === 'google' ? 'Google' : 'Apple';
    
    Alert.alert(
      `${providerName} Sign-In Error`,
      `Failed to sign in with ${providerName}. ${error}`,
      [
        { text: 'OK', style: 'default' },
        { text: 'Try Again', onPress: () => {
          if (provider === 'google') {
            this.signInWithGoogle();
          } else {
            this.signInWithApple();
          }
        }},
      ]
    );
  }
}

export const oAuthService = new OAuthService();
export default oAuthService;