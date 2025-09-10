import React, { FC } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList, SCREENS } from './types';
import { TabNavigator } from './TabNavigator';
import { SplashScreen } from '@/screens/Splash';
import { OnboardingScreen } from '@/screens/Onboarding';
import { AuthScreen } from '@/screens/Auth';
import { useIsAuthenticated, useHasSeenOnboarding } from '@/store';

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator: FC = () => {
  // TODO: Replace with actual authentication logic
  const isAuthenticated = false;
  const hasSeenOnboarding = false;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      {/* Show splash screen first */}
      <Stack.Screen 
        name={SCREENS.SPLASH}
        component={SplashScreen}
      />
      
      {/* Show onboarding if user hasn't seen it */}
      {!hasSeenOnboarding && (
        <Stack.Screen 
          name={SCREENS.ONBOARDING}
          component={OnboardingScreen}
        />
      )}
      
      {/* Show auth screen if not authenticated */}
      {!isAuthenticated ? (
        <Stack.Screen 
          name={SCREENS.AUTH}
          component={AuthScreen}
        />
      ) : (
        /* Show main app if authenticated */
        <Stack.Screen 
          name={SCREENS.MAIN}
          component={TabNavigator}
        />
      )}
    </Stack.Navigator>
  );
};
