/**
 * Navigation Type Definitions
 * Defines all screen names and their parameters
 */

import { NavigatorScreenParams } from '@react-navigation/native';

// Root Stack Navigator (handles auth flow)
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Main Tab Navigator (bottom tabs)
export type MainTabParamList = {
  Home: undefined;
  Scan: undefined;
  MyPlants: undefined;
  Profile: undefined;
};

// Home Stack Navigator
export type HomeStackParamList = {
  HomeScreen: undefined;
  PlantDetail: { plantId: string };
  AddPlant: { 
    speciesId?: string;
    identificationData?: any;
  };
};

// Scan Stack Navigator  
export type ScanStackParamList = {
  Camera: undefined;
  PlantResult: {
    imageUri: string;
    identificationData: any;
  };
};

// Plants Stack Navigator
export type PlantsStackParamList = {
  PlantsList: undefined;
  PlantDetail: { plantId: string };
  EditPlant: { plantId: string };
};

// Auth Stack Navigator
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Onboarding Stack Navigator
export type OnboardingStackParamList = {
  Welcome: undefined;
  PlantIdentification: undefined;
  CareReminders: undefined;
  PlantPositioning: undefined;
};

// Screen names as constants for type safety
export const SCREENS = {
  // Root screens
  SPLASH: 'Splash' as const,
  ONBOARDING: 'Onboarding' as const,
  AUTH: 'Auth' as const,
  MAIN: 'Main' as const,
  
  // Main tabs
  HOME: 'Home' as const,
  SCAN: 'Scan' as const,
  MY_PLANTS: 'MyPlants' as const,
  PROFILE: 'Profile' as const,
  
  // Home stack
  HOME_SCREEN: 'HomeScreen' as const,
  PLANT_DETAIL: 'PlantDetail' as const,
  ADD_PLANT: 'AddPlant' as const,
  
  // Scan stack
  CAMERA: 'Camera' as const,
  PLANT_RESULT: 'PlantResult' as const,
  
  // Plants stack
  PLANTS_LIST: 'PlantsList' as const,
  EDIT_PLANT: 'EditPlant' as const,
  
  // Auth stack
  LOGIN: 'Login' as const,
  REGISTER: 'Register' as const,
  FORGOT_PASSWORD: 'ForgotPassword' as const,
  
  // Onboarding stack
  WELCOME: 'Welcome' as const,
  PLANT_IDENTIFICATION_INTRO: 'PlantIdentification' as const,
  CARE_REMINDERS_INTRO: 'CareReminders' as const,
  PLANT_POSITIONING_INTRO: 'PlantPositioning' as const,
} as const;