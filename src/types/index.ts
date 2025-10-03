// Core Types for Lotus App

export interface User {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  first_name?: string;
  avatar_url?: string;
  language?: 'en' | 'ar';
  created_at: string;
}

export interface Plant {
  id: string;
  user_id: string;
  species_id?: string;
  nickname: string;
  location: 'living_room' | 'bedroom' | 'kitchen' | 'bathroom' | 'balcony';
  window_direction: 'north' | 'east' | 'south' | 'west';
  image_url?: string;
  health_status: 'healthy' | 'needs_attention' | 'critical';
  last_watered_at?: string;
  next_watering_at?: string;
  created_at: string;
  updated_at: string;
  // Optional identification fields
  common_name?: string;
  scientific_name?: string;
  family?: string;
  plant_info?: string;
  plant_type?: string;
  watering_schedule?: string;
  preferred_humidity?: string;
  preferred_orientation?: string;
}

export interface CareRecommendation {
  light: string;
  placement: string;
  watering: string;
  humidity: string;
}

export interface PlantSpecies {
  id: string;
  name_en: string;
  name_ar: string;
  scientific_name?: string;
  watering_frequency_days: number;
  light_requirement: 'low' | 'medium' | 'bright_indirect' | 'direct';
  window_ratings: {
    north: number;
    east: number;
    south: number;
    west: number;
  };
  care_tips_en: string[];
  care_tips_ar: string[];
  cairo_specific_tips?: string;
  created_at: string;
}

export interface CareEvent {
  id: string;
  plant_id: string;
  user_id: string;
  event_type: 'water' | 'fertilize' | 'prune' | 'repot';
  completed_at: string;
  notes?: string;
  created_at: string;
}

export interface IdentificationResult {
  confidence: number;
  common_name: string;
  scientific_name: string;
  family?: string;
  genus?: string;
  plant_info: string;
  plant_type: string; // Allow any plant type string
  watering_schedule: string; // Display-ready string like "60% Dry - Water when mostly dry"
  preferred_humidity: string; // Display-ready string like "Medium" 
  preferred_orientation: string; // Display-ready string like "Indoor - East Window"
  alternatives?: Array<{
    common_name: string;
    scientific_name: string;
    confidence: number;
  }>;
  suggestions: string[];
}

// Enum types for internal plant data validation
export type WateringScheduleEnum = '100_dry' | '60_dry' | '30_dry';
export type OrientationEnum = 'north' | 'east' | 'south' | 'west' | 'bright_indirect' | 'low_light';
export type PlantTypeEnum = 'tropical' | 'succulent' | 'flowering' | 'foliage' | 'herb' | 'fern';

export type NavigationParamList = {
  Home: undefined;
  Scan: undefined;
  Plants: undefined;
  PlantDetail: { plantId: string };
  AddPlant: { identificationResult?: IdentificationResult; capturedImage?: string };
  Settings: undefined;
  Auth: undefined;
  EmailAuth: undefined;
  MainTabs: undefined;
  Main: undefined;
  PlantsList: undefined;
  [key: string]: any;
}

// Weather data for Cairo
export interface WeatherData {
  temperature: number;
  humidity: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'hot' | 'mild';
  description: string;
  windSpeed: number;
  lastUpdated: Date;
  location: string;
  careRecommendation: {
    type: 'increase' | 'normal' | 'reduce';
    message: string;
    adjustment: number;
  };
}

// Smart care recommendations
export interface CareRecommendation {
  plantId: string;
  type: 'water' | 'fertilize' | 'prune' | 'repot';
  urgency: 'low' | 'medium' | 'high';
  reason: string;
  weatherInfluence?: string;
  nextDueDate: string;
}

export interface AppState {
  user: User | null;
  plants: Plant[];
  species: PlantSpecies[];
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  language: 'en' | 'ar';
  isRTL: boolean;
  weather: WeatherData | null;
  careRecommendations: CareRecommendation[];
}