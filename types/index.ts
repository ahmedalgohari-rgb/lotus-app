// Core Types for Lotus App

export interface User {
  id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
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
  species_id?: string;
  confidence: number;
  common_name: string;
  scientific_name: string;
  suggestions: PlantSpecies[];
}

export interface NavigationParamList {
  Home: undefined;
  Scan: undefined;
  Plants: undefined;
  PlantDetail: { plantId: string };
  AddPlant: { identificationResult?: IdentificationResult };
  Auth: undefined;
}

export interface AppState {
  user: User | null;
  plants: Plant[];
  species: PlantSpecies[];
  isLoading: boolean;
  isAuthenticated: boolean;
}