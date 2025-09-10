/**
 * Enhanced Onboarding Types
 * Progressive personalization for world-class user activation
 */

export interface OnboardingProfile {
  // User Experience Level
  experience: 'beginner' | 'intermediate' | 'expert';
  
  // Plant Interests (multi-select)
  interests: PlantInterest[];
  
  // Living Space Type
  spaceType: 'apartment' | 'house' | 'office' | 'outdoor';
  
  // Available Light Conditions
  lightConditions: 'low' | 'medium' | 'high' | 'mixed';
  
  // Geographic Context
  climate: 'desert' | 'mediterranean' | 'tropical' | 'temperate';
  
  // Goals
  goals: PlantGoal[];
  
  // Language Preference
  language: 'en' | 'ar';
  
  // Optional: Name for personalization
  name?: string;
}

export interface PlantInterest {
  id: string;
  nameEn: string;
  nameAr: string;
  icon: string;
  category: 'indoor' | 'outdoor' | 'succulent' | 'flowering' | 'herbs' | 'trees';
}

export interface PlantGoal {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: string;
  difficulty: 'easy' | 'medium' | 'advanced';
}

export interface OnboardingStep {
  id: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  type: 'selection' | 'slider' | 'input' | 'confirmation';
  required: boolean;
  options?: OnboardingOption[];
  multiSelect?: boolean;
  illustration: string;
  tips?: {
    en: string;
    ar: string;
  };
}

export interface OnboardingOption {
  id: string;
  labelEn: string;
  labelAr: string;
  icon: string;
  description?: {
    en: string;
    ar: string;
  };
  recommended?: boolean;
}

// Onboarding State Management
export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  profile: Partial<OnboardingProfile>;
  isComplete: boolean;
  canProceed: boolean;
  recommendations: PlantRecommendation[];
}

export interface PlantRecommendation {
  id: string;
  names: {
    english: string;
    arabic: string;
    scientific: string;
  };
  difficulty: 'beginner' | 'intermediate' | 'expert';
  matchScore: number; // 0-100
  reasons: string[]; // Why this plant matches the user
  care: {
    watering: string;
    light: string;
    environment: string;
  };
  personalizedTip: string;
}