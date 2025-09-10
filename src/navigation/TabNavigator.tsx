import React, { FC } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { Colors, Layout, Typography } from '@/constants';
import { MainTabParamList, SCREENS } from './types';
import { CameraScreen } from '@/screens/Camera';

// Temporary placeholder screens - will be replaced with actual screens
const HomeScreen: FC = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>🏠 Home Screen</Text>
    <Text style={styles.placeholderSubtext}>Plant care guidelines & today's tasks</Text>
  </View>
);

const MyPlantsScreen: FC = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>🌱 My Plants</Text>
    <Text style={styles.placeholderSubtext}>Your plant collection</Text>
  </View>
);

const ProfileScreen: FC = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>👤 Profile</Text>
    <Text style={styles.placeholderSubtext}>Settings & account</Text>
  </View>
);

// Tab icons (using emojis for now, will be replaced with proper icons)
const getTabIcon = (routeName: string, focused: boolean): string => {
  const icons: Record<string, string> = {
    [SCREENS.HOME]: '🏠',
    [SCREENS.SCAN]: '📷', 
    [SCREENS.MY_PLANTS]: '🌱',
    [SCREENS.PROFILE]: '👤',
  };
  return icons[routeName] || '●';
};

// Tab labels with Arabic support
const getTabLabel = (routeName: string): { en: string; ar: string } => {
  const labels: Record<string, { en: string; ar: string }> = {
    [SCREENS.HOME]: { en: 'Home', ar: 'الرئيسية' },
    [SCREENS.SCAN]: { en: 'Scan', ar: 'مسح' },
    [SCREENS.MY_PLANTS]: { en: 'Plants', ar: 'النباتات' },
    [SCREENS.PROFILE]: { en: 'Profile', ar: 'الملف' },
  };
  return labels[routeName] || { en: 'Tab', ar: 'تبويب' };
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const TabNavigator: FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          const icon = getTabIcon(route.name, focused);
          return (
            <Text style={[
              styles.tabIcon,
              { color: focused ? Colors.lotusGreen : Colors.textSecondary }
            ]}>
              {icon}
            </Text>
          );
        },
        tabBarLabel: ({ focused }) => {
          const label = getTabLabel(route.name);
          return (
            <Text style={[
              styles.tabLabel,
              { color: focused ? Colors.lotusGreen : Colors.textSecondary }
            ]}>
              {label.en}
            </Text>
          );
        },
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.lotusGreen,
        tabBarInactiveTintColor: Colors.textSecondary,
        headerStyle: {
          backgroundColor: Colors.pureWhite,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          ...Typography.screenTitle,
          color: Colors.textPrimary,
        },
        headerTintColor: Colors.lotusGreen,
      })}
    >
      <Tab.Screen 
        name={SCREENS.HOME}
        component={HomeScreen}
        options={{
          title: 'Lotus Plant Care',
        }}
      />
      <Tab.Screen 
        name={SCREENS.SCAN}
        component={CameraScreen}
        options={{
          title: 'Plant Scanner',
          headerShown: false, // Camera screen has its own header
        }}
      />
      <Tab.Screen 
        name={SCREENS.MY_PLANTS}
        component={MyPlantsScreen}
        options={{
          title: 'My Plants',
        }}
      />
      <Tab.Screen 
        name={SCREENS.PROFILE}
        component={ProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.pureWhite,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: Layout.bottomTabHeight,
    paddingBottom: Layout.screenPadding,
    paddingTop: Layout.sm,
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabLabel: {
    ...Typography.caption,
    fontSize: 10,
  },
  // Placeholder screen styles
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Layout.screenPadding,
  },
  placeholderText: {
    ...Typography.screenTitle,
    color: Colors.lotusGreen,
    textAlign: 'center',
    marginBottom: Layout.sm,
  },
  placeholderSubtext: {
    ...Typography.bodySecondary,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default TabNavigator;