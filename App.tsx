import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LogBox, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { useFonts } from 'expo-font';
import { PlusJakartaSans_400Regular, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';

import AppNavigator from './src/navigation/AppNavigator';
import { initializeStore, useStore } from './src/store';
import { authService, dbService, supabase } from './src/services/supabase';
import * as NotificationService from './src/services/notifications';
import './src/i18n'; // Initialize i18n

// Ignore specific warnings for development
LogBox.ignoreLogs([
  'Warning: componentWillReceiveProps has been renamed',
  'Warning: componentWillMount has been renamed',
  'Require cycle:', // Common in React Navigation
  'SafeAreaView has been deprecated', // From library using old SafeAreaView
  'Exception in HostFunction', // Type mismatch in New Architecture (non-fatal)
]);

export default function App() {
  const { setUser, setAuthenticated, setLoading, isRTL } = useStore();

  // Load Tharwat Emara Ruqaa font for bilingual compass
  const [fontsLoaded] = useFonts({
    'TharwatEmaraRuqaa': require('./assets/fonts/TharwatEmaraRuqaa.ttf'),
    'DecotypeNaskhSwashes': require('./assets/fonts/DecotypeNaskhSwashes.ttf'),
    'PlusJakartaSans-Regular': PlusJakartaSans_400Regular,
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    initializeApp();

    // Handle incoming deep links
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Check for initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = async (url: string) => {
    console.log('🔗 Deep link received:', url);

    const params: Record<string, string> = {};

    // Extract params from URL fragment (#access_token=...)
    const fragment = url.split('#')[1];
    if (fragment) {
      fragment.split('&').forEach(part => {
        const [key, value] = part.split('=');
        if (key && value) {
          params[key] = decodeURIComponent(value);
        }
      });
    }

    // Extract params from query string (?code=... or ?error=...)
    const queryString = url.split('?')[1]?.split('#')[0];
    if (queryString) {
      queryString.split('&').forEach(part => {
        const [key, value] = part.split('=');
        if (key && value) {
          params[key] = decodeURIComponent(value);
        }
      });
    }

    console.log('🔗 Extracted params:', params);

    // Handle OAuth errors
    if (params['error']) {
      console.error('❌ OAuth error:', params['error'], params['error_description']);
      return;
    }

    // Handle tokens directly in URL (implicit flow)
    const accessToken = params['access_token'];
    const refreshToken = params['refresh_token'];

    if (accessToken && refreshToken) {
      console.log('✅ Found tokens in URL, setting session...');
      try {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('❌ Error setting session:', error);
          return;
        }

        if (data.user) {
          const { data: profileData } = await dbService.getProfile(data.user.id);

          setUser({
            id: data.user.id,
            email: data.user.email,
            name: profileData?.first_name || data.user.user_metadata?.name || data.user.email,
            first_name: profileData?.first_name,
            avatar_url: data.user.user_metadata?.avatar_url,
            created_at: data.user.created_at,
          });
          setAuthenticated(true);
          console.log('✅ Session set successfully!');
        }
      } catch (error) {
        console.error('❌ Error in deep link handler:', error);
      }
    } else {
      console.log('ℹ️ No tokens found in deep link URL');
    }
  };

  const initializeApp = async () => {
    try {
      setLoading(true);

      // Initialize store from storage
      await initializeStore();

      // Check for existing auth session
      const { session } = await authService.getSession();
      if (session?.user) {
        // Try to get user's profile with first_name
        const { data: profileData } = await dbService.getProfile(session.user.id);

        const userData = {
          id: session.user.id,
          email: session.user.email,
          phone: session.user.phone,
          name: profileData?.first_name || session.user.user_metadata?.name || session.user.email,
          first_name: profileData?.first_name,
          avatar_url: session.user.user_metadata?.avatar_url,
          created_at: session.user.created_at,
        };

        setUser(userData);
        setAuthenticated(true);

        // Load garden location from profile if available
        if (profileData?.garden_lat && profileData?.garden_lon) {
          useStore.getState().setGardenLocation({
            lat: profileData.garden_lat,
            lon: profileData.garden_lon,
            name: profileData.garden_name || '',
          });
        }
      }

      // Reschedule notifications on launch (uses plants loaded from store)
      const plants = useStore.getState().plants;
      if (plants.length > 0) {
        NotificationService.rescheduleAll(plants);
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setLoading(false);
    }
  };

  // Wait for fonts to load before rendering app
  if (!fontsLoaded) {
    return null; // Or you could return a loading screen
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <StatusBar style="auto" />
        <AppNavigator />
      </View>
    </SafeAreaProvider>
  );
}