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
  plant_id?: string;  // Database plant ID (for local image lookup)
  nickname: string;
  location: 'living_room' | 'bedroom' | 'kitchen' | 'bathroom' | 'balcony';
  window_direction: 'north' | 'east' | 'south' | 'west';
  placement_score?: number;  // Location rating: 1-5 stars (from placement analysis)
  image_url?: string;
  captured_image_uri?: string;  // User's captured photo (local file URI)
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

  // NEW: Database matching fields for curated plant tracking
  database_match?: {
    found: boolean;              // true if matched to database plant
    confidence: number;          // matching confidence (0-100)
    plant_id: string | null;     // Database plant ID (e.g., "golden_pothos")
    match_type: 'exact' | 'genus' | 'common_name' | 'none';
    alternatives?: Array<{       // Other possible matches (if genus match)
      plant_id: string;
      confidence: number;
      plant_name: string;
    }>;
  };
  care_available?: boolean;      // false if plant not in curated database
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
  AddPlant: {
    identificationResult?: IdentificationResult;
    capturedImage?: string;  // Camera photo URI (only for scanned plants)
    plantDatabaseId?: string;  // Database plant ID (only for selected plants, e.g., "euphorbia_trigona")
  };
  PlantResult: {
    identificationResult: IdentificationResult;
    capturedImage?: string;  // Camera photo URI (only for scanned plants)
    plantDatabaseId?: string;  // Database plant ID (only for selected plants)
    fromSearch?: boolean;
  };
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

// Enhanced Care Recommendation System (Phase 15.0)
export interface PlacementScore {
  score: 1 | 2 | 3 | 4 | 5;
  scoreText: 'Very Challenging' | 'Challenging' | 'Good' | 'Very Good' | 'Excellent';
  stars: string; // Visual representation like "★★★★★"
}

export interface CareWarning {
  type: 'danger' | 'warning' | 'info';
  message: string;
  icon: string; // Emoji or icon name
}

// Static room modifiers (fallback when weather unavailable)
export interface RoomModifier {
  room: string;
  acEffect?: boolean; // AC dries air
  steamEffect?: boolean; // Bathroom steam
  cookingHeat?: boolean; // Kitchen heat
  humidityModifier: number; // ±% humidity change
  evaporationRate: number; // ±% evaporation rate
  note: string; // Human-readable explanation
}

// Static direction modifiers (fallback when weather unavailable)
export interface DirectionModifier {
  direction: 'north' | 'east' | 'south' | 'west';
  season: string;
  lightIntensity: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
  wateringAdjustment: number; // ±days to add/subtract
  warning?: string; // Alert for challenging conditions
  benefit?: string; // Positive note for good conditions
}

// Weather-aware room modifiers (scales with temperature)
export interface WeatherAwareRoomModifier {
  room: 'living_room' | 'bedroom' | 'kitchen' | 'bathroom' | 'balcony' | 'office';
  getModifiers: (weather: WeatherData) => {
    humidityModifier: number; // Dynamic ±% based on temperature
    evaporationRate: number; // Dynamic ±% based on conditions
    note: string; // Context-aware explanation
  };
}

// Weather-aware direction modifiers (scales with conditions)
export interface WeatherAwareDirectionModifier {
  direction: 'north' | 'east' | 'south' | 'west';
  season: 'winter' | 'spring' | 'summer' | 'autumn';
  getModifiers: (weather: WeatherData) => {
    lightIntensity: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
    wateringAdjustment: number; // Dynamic ±days based on temperature/humidity
    warning?: string; // Condition-specific warnings
    benefit?: string; // Condition-specific benefits
  };
}

export interface WeatherContext {
  temperature: number;
  humidity: number;
  condition: string;
  lastUpdated: Date;
  impact: string;
}

// Environmental context combining weather + room + direction
export interface EnvironmentalContext {
  weather: WeatherData;
  room: {
    type: 'living_room' | 'bedroom' | 'kitchen' | 'bathroom' | 'balcony' | 'office';
    humidityModifier: number;
    evaporationRate: number;
    note: string;
  };
  direction: {
    type: 'north' | 'east' | 'south' | 'west';
    season: 'winter' | 'spring' | 'summer' | 'autumn';
    lightIntensity: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
    wateringAdjustment: number;
    note: string;
  };
}

export interface EnhancedCareRecommendation {
  score: PlacementScore;
  plant: {
    id: string;
    name: string;
    scientificName?: string;
    baseWatering: string; // "10-14 days (100% dry)"
    lightRequirement: string; // "Medium light"
    lightTolerance: string[]; // ["low_light", "bright_indirect"]
    humidityPreference: string; // "Low (15-25%)"
  };
  environment: {
    room: string;
    direction: string;
    season: string;
    roomFactor: string; // "AC dries air faster"
    directionFactor: string; // "South window = intense afternoon sun"
    weatherConditions?: string; // "38°C, 18% humidity" when weather available
  };
  adjusted: {
    watering: string; // "Water every 7-9 days (AC + heat)"
    wateringFrequency: string; // "Check every 5 days"
    placement: string; // "Move 3 feet from south window"
    humidity: string; // "Mist once per week (extreme heat)"
    reasoning: string; // Explanation for adjustments
  };
  warnings: CareWarning[];
  tips: string[];
  reasoning: {
    score: string; // Why this placement got this score
    watering: string; // Why watering was adjusted
    placement: string; // Why placement recommendation given
  };
  weatherContext?: WeatherContext;
  environmentalContext?: EnvironmentalContext; // Full context when weather available
}

// Smart care recommendations (legacy - to be potentially replaced by EnhancedCareRecommendation)
export interface SmartCareRecommendation {
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
  careRecommendations: SmartCareRecommendation[];
}