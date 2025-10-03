import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LogBox, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';

import AppNavigator from './src/navigation/AppNavigator';
import { initializeStore, useStore } from './src/store';
import { authService, supabase } from './src/services/supabase';
import './src/i18n'; // Initialize i18n

// Ignore specific warnings for development
LogBox.ignoreLogs([
  'Warning: componentWillReceiveProps has been renamed',
  'Warning: componentWillMount has been renamed',
  'Require cycle:', // Common in React Navigation
]);

export default function App() {
  const { setUser, setAuthenticated, setLoading, isRTL } = useStore();

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
      } else if (url === null) {
        // Handle the case where getInitialURL returns null, which can happen if no deep link was used to open the app
        // For example, if the app was opened directly or from a launcher icon
        // In this scenario, you might want to check for a pending session or do nothing specific.
        console.log('No initial URL found, app launched directly.');
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = (url: string) => {
    const fragment = url.split('#')[1];
    if (!fragment) return;

    console.log("Handling deep link with fragment:", fragment);

    const params: Record<string, string> = {};
    fragment.split('&').forEach(part => {
      const [key, value] = part.split('=');
      if (key && value) {
        params[key] = value;
      }
    });

    const accessToken = params['access_token'];
    const refreshToken = params['refresh_token'];

    if (accessToken && refreshToken) {
      console.log('Found tokens in URL, setting session...');
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ data }) => {
        if (data.user) {
          console.log('Session set successfully, user is:', data.user.email);
          setUser({
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.email,
            avatar_url: data.user.user_metadata?.avatar_url,
            created_at: data.user.created_at,
          });
          setAuthenticated(true);
        }
      }).catch(error => {
        console.error('Error setting session:', error);
      });
    } else {
      console.log('Tokens not found in URL fragment.');
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
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email,
          avatar_url: session.user.user_metadata?.avatar_url,
          created_at: session.user.created_at,
        });
        setAuthenticated(true);
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <StatusBar style="auto" />
        <AppNavigator />
      </View>
    </SafeAreaProvider>
  );
}