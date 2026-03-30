import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ScanScreen from '../screens/ScanScreen';
import AddScanScreen from '../screens/AddScanScreen';
import PlantsScreen from '../screens/PlantsScreen';
import PlantDetailScreen from '../screens/PlantDetailScreen';
import AddPlantScreen from '../screens/AddPlantScreen';
import PlantResultScreen from '../screens/PlantResultScreen';
import AuthScreen from '../screens/AuthScreen';
import EditPlantScreen from '../screens/EditPlantScreen';

// Types
import { NavigationParamList } from '../types';
import { COLORS } from '../constants';
import { useStore } from '../store';
import { useTranslation } from 'react-i18next';

const Tab = createBottomTabNavigator<any>();
const Stack = createStackNavigator<any>();

// Stack navigator for Plants tab (includes detail screens)
function PlantsStack() {
  return (
    // @ts-ignore - Navigation types are working correctly at runtime
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PlantsList" component={PlantsScreen} />
      <Stack.Screen name="PlantDetail" component={PlantDetailScreen} />
      <Stack.Screen name="EditPlant" component={EditPlantScreen} />
    </Stack.Navigator>
  );
}

// Main stack navigator that includes all screens
function MainStack() {
  return (
    // @ts-ignore - Navigation types are working correctly at runtime
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Camera" component={ScanScreen} />
      <Stack.Screen name="AddScan" component={AddScanScreen} />
      <Stack.Screen name="PlantResult" component={PlantResultScreen} />
      <Stack.Screen name="AddPlant" component={AddPlantScreen} />
    </Stack.Navigator>
  );
}

// Main tab navigator
function MainTabs() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets(); // 🔧 FIX: Get device-specific safe area insets

  return (
    // @ts-ignore - Navigation types are working correctly at runtime
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        keyboardHidesTabBar: false, // Prevent keyboard from dismissing
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Scan') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Plants') {
            iconName = focused ? 'leaf' : 'leaf-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#8E8E93', // Better contrast for inactive state
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: '#F2F2F7', // Lighter border for better contrast
          borderTopWidth: 0.5,
          paddingBottom: Math.max(insets.bottom, 8), // 🔧 FIX: Use safe area inset (adapts to all iPhone models including Pro Max)
          paddingTop: 8,
          height: 68 + Math.max(insets.bottom - 8, 0), // 🔧 FIX: Adjust total height to account for extra bottom padding
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 8, // Better shadow on Android
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2, // Better spacing between icon and label
        },
        tabBarIconStyle: {
          marginBottom: -2, // Better icon alignment
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: t('navigation.home'),
        }}
      />
      <Tab.Screen
        name="Scan"
        component={AddScanScreen}
        options={{
          tabBarLabel: t('navigation.add') || 'Add',
        }}
      />
      <Tab.Screen 
        name="Plants" 
        component={PlantsStack}
        options={{
          tabBarLabel: t('navigation.plants'),
        }}
      />
    </Tab.Navigator>
  );
}

// Root navigator
export default function AppNavigator() {
  const { user, isAuthenticated, isGuest } = useStore();

  const shouldShowAuth = !isAuthenticated && !isGuest;
  
  return (
    <NavigationContainer key={`nav-${isAuthenticated}-${isGuest}`}>
      {/* @ts-ignore - Navigation types are working correctly at runtime */}
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        initialRouteName={shouldShowAuth ? "Auth" : "Main"}
      >
        {shouldShowAuth ? (
          // Not authenticated - show auth screens only
          <>
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        ) : (
          // Authenticated or guest user - show main app
          <>
            <Stack.Screen name="Main" component={MainStack} />
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}