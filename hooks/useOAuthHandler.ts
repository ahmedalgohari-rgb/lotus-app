import { useEffect } from 'react';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { useAuthActions } from '@/store/authStore';

export const useOAuthHandler = () => {
  const router = useRouter();
  const { initializeAuth } = useAuthActions();

  useEffect(() => {
    // Handle URL changes for OAuth callbacks
    const handleUrl = async (url: string) => {
      if (url.includes('lotus://auth/callback')) {
        try {
          // Extract the URL fragment that contains the auth tokens
          const urlObj = new URL(url.replace('lotus://auth/callback#', 'lotus://auth/callback?'));
          
          const access_token = urlObj.searchParams.get('access_token');
          const refresh_token = urlObj.searchParams.get('refresh_token');
          
          if (access_token && refresh_token) {
            // Set the session in Supabase
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            
            if (!error) {
              // Navigate to the main app
              router.replace('/(tabs)');
            }
          }
        } catch (error) {
          console.error('OAuth callback error:', error);
        }
      }
    };

    // Listen for URL changes
    const subscription = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    // Check for initial URL when app starts
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl(url);
      }
    });

    // Initialize auth state listener
    initializeAuth();

    return () => {
      subscription?.remove();
    };
  }, [router, initializeAuth]);
};