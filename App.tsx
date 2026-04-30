import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LogBox, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { useFonts } from 'expo-font';
import { PlusJakartaSans_400Regular, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';

import AppNavigator from './src/navigation/AppNavigator';
import { initializeStore, useStore } from './src/store';
import { authService, dbService, supabase } from './src/services/supabase';
import * as NotificationService from './src/services/notifications';
import NotificationPromptModal from './src/components/NotificationPromptModal';
import { trackAppOpened, identifyUser, setUserProperty, trackCareReminderEngagement } from './src/services/analytics';
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
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

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

    // Track when user taps a care reminder notification — this is the
    // strongest engagement signal we have. If users ignore reminders, the
    // whole care-schedule feature is dead weight.
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data || {};
      if (data.plantId) {
        trackCareReminderEngagement({
          action: 'tapped',
          daysOverdue: typeof data.daysOverdue === 'number' ? data.daysOverdue : undefined,
        });
      }
    });

    return () => {
      subscription.remove();
      responseSub.remove();
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

      // Verify auth session with Supabase in the background.
      // The store already restored isAuthenticated from cache (instant),
      // so the user sees the main app immediately. This just refreshes
      // the session data or signs out if the session expired.
      const { session } = await authService.getSession();
      if (session?.user) {
        // Session valid — refresh user data from server
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

        // Identify user in Mixpanel
        identifyUser(session.user.id, {
          name: userData.name,
          email: userData.email,
          created_at: userData.created_at,
        });

        // Load garden location from profile if available
        if (profileData?.garden_lat && profileData?.garden_lon) {
          useStore.getState().setGardenLocation({
            lat: profileData.garden_lat,
            lon: profileData.garden_lon,
            name: profileData.garden_name || '',
          });
        }
      } else if (useStore.getState().isAuthenticated) {
        // Cached auth was stale — session expired, sign out gracefully
        console.log('⚠️ Cached session expired, signing out');
        setUser(null);
        setAuthenticated(false);
      }

      // Reschedule notifications on launch (uses plants loaded from store)
      const plants = useStore.getState().plants;
      if (plants.length > 0) {
        NotificationService.rescheduleAll(plants);
      }

      // Progressive engagement: prompt existing users for notifications if they
      // never saw it. The garden-location prompt now lives on the My Garden tab,
      // triggered via useFocusEffect there — no longer fired on app launch.
      if (plants.length > 0) {
        const notifPromptShown = await NotificationService.hasPromptBeenShown();
        const notifEnabled = await NotificationService.isEnabled();
        if (!notifPromptShown && !notifEnabled) {
          // Delay slightly so the app UI loads first
          setTimeout(() => setShowNotificationPrompt(true), 1500);
        }
      }
      // Track app opened
      trackAppOpened();
      setUserProperty('plant_count', useStore.getState().plants.length);
      setUserProperty('language', useStore.getState().language);
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationEnable = async () => {
    setShowNotificationPrompt(false);
    const granted = await NotificationService.requestPermission();
    await NotificationService.markPromptShown();
    if (granted) {
      const plants = useStore.getState().plants;
      await NotificationService.rescheduleAll(plants);
    }
  };

  const handleNotificationSkip = async () => {
    setShowNotificationPrompt(false);
    await NotificationService.markPromptShown();
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
        <NotificationPromptModal
          visible={showNotificationPrompt}
          onEnable={handleNotificationEnable}
          onSkip={handleNotificationSkip}
        />
      </View>
    </SafeAreaProvider>
  );
}