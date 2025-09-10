/**
 * Root Layout for Lotus Plant Care App
 * Using Expo Router with Lotus design system and i18n
 */
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants';
// Initialize i18n for translations
import '@/localization/i18n';
import { useAuthActions } from '@/store/authStore';
import ErrorBoundary from '@/components/ErrorBoundary';
// Removed OAuth handler to prevent native module issues on startup
// import { useOAuthHandler } from '@/hooks/useOAuthHandler';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    // Load custom fonts here if needed
    // 'Cairo': require('../assets/fonts/Cairo-Regular.ttf'),
  });
  
  const { initializeAuth } = useAuthActions();

  useEffect(() => {
    // Initialize auth (but skip Supabase to avoid crashes)
    if (loaded) {
      initializeAuth();
      SplashScreen.hideAsync();
    }
  }, [loaded, initializeAuth]);

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <StatusBar style="dark" backgroundColor={Colors.background} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.textPrimary,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen 
          name="splash" 
          options={{ 
            headerShown: false,
            gestureEnabled: false,
          }} 
        />
        <Stack.Screen 
          name="onboarding" 
          options={{ 
            headerShown: false,
            gestureEnabled: false,
          }} 
        />
        <Stack.Screen 
          name="auth" 
          options={{ 
            headerShown: false,
            gestureEnabled: false,
          }} 
        />
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false,
          }} 
        />
      </Stack>
    </ErrorBoundary>
  );
}