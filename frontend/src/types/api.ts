// API Types based on our backend documentation

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
  timestamp?: string;
}

export interface ApiError {
  code: string;
  message: string | { en: string; ar: string };
  details?: Array<{
    field: string;
    message: string | { en: string; ar: string };
  }>;
}

// Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  deviceId: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceId: string;
}

// Plant Types
export interface Plant {
  id: string;
  name: string;
  scientificName?: string;
  variety?: string;
  wateringFrequency?: number;
  fertilizingFrequency?: number;
  sunlightRequirement?: 'full' | 'partial' | 'low';
  temperatureMin?: number;
  temperatureMax?: number;
  humidityRequirement?: 'low' | 'moderate' | 'high';
  primaryImageUrl?: string;
  location?: string; // JSON string
  healthStatus: string;
  healthScore?: number;
  lastWateredAt?: string;
  lastFertilizedAt?: string;
  lastPrunedAt?: string;
  lastRepottedAt?: string;
  acquisitionDate?: string;
  source?: string;
  age?: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface CreatePlantRequest {
  name: string;
  scientificName?: string;
  variety?: string;
  wateringFrequency?: number;
  fertilizingFrequency?: number;
  sunlightRequirement?: 'full' | 'partial' | 'low';
  temperatureMin?: number;
  temperatureMax?: number;
  humidityRequirement?: 'low' | 'moderate' | 'high';
  location?: string;
  acquisitionDate?: string;
  source?: string;
}

export interface UpdatePlantRequest extends Partial<CreatePlantRequest> {}

export interface PlantStats {
  total: number;
  indoor: number;
  outdoor: number;
}

// Care Logging Types
export type CareType = 'WATERING' | 'FERTILIZING' | 'PRUNING' | 'REPOTTING' | 'OBSERVATION';

export interface CareLog {
  id: string;
  userId: string;
  plantId: string;
  type: CareType;
  notes?: string;
  metadata?: string; // JSON string
  imageUrl?: string;
  performedAt: string;
  createdAt: string;
}

export interface CreateCareLogRequest {
  plantId: string;
  type: CareType;
  notes?: string;
  metadata?: string;
  imageUrl?: string;
  performedAt?: string;
}

export interface CareStats {
  totalActions: number;
  wateringActions: number;
  fertilizingActions: number;
  pruningActions: number;
  repottingActions: number;
  observationActions: number;
  averageActionsPerDay: number;
  mostActiveDay: string;
}

// Plant Identification Types
export interface PlantIdentification {
  names: {
    arabic: string;
    english: string;
    scientific: string;
  };
  confidence: number;
  care: {
    water: string;
    light: string;
    environment: string;
  };
}

export interface IdentifyPlantRequest {
  description: string;
  metadata?: {
    location?: {
      latitude: number;
      longitude: number;
    };
    environment?: 'indoor' | 'outdoor';
    lightCondition?: 'low' | 'medium' | 'bright';
  };
}

export interface IdentifyPlantResponse {
  identification: PlantIdentification;
  metadata: {
    searchTerm: string;
    timestamp: string;
    userId: string;
    location?: {
      latitude: number;
      longitude: number;
    };
    environment?: 'indoor' | 'outdoor';
    lightCondition?: 'low' | 'medium' | 'bright';
  };
}

export interface DatabasePlant {
  id: string;
  names: {
    arabic: string;
    english: string;
    scientific: string;
  };
  care: {
    water: string;
    light: string;
    environment: string;
    temperature?: string;
    humidity?: string;
  };
  matchScore?: number;
}

// Pagination Types
export interface PaginatedResponse<T> {
  data: T[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  count: number;
}

// Error Codes
export enum ApiErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  PLANT_NOT_FOUND = 'PLANT_NOT_FOUND',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  PLANT_NAME_EXISTS = 'PLANT_NAME_EXISTS',
  UNPROCESSABLE_ENTITY = 'UNPROCESSABLE_ENTITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

// Location Types (Egyptian cities)
export interface Location {
  city: string;
  governorate: string;
  latitude?: number;
  longitude?: number;
}

export const EGYPTIAN_CITIES: Location[] = [
  { city: 'Cairo', governorate: 'Cairo', latitude: 30.0444, longitude: 31.2357 },
  { city: 'Alexandria', governorate: 'Alexandria', latitude: 31.2001, longitude: 29.9187 },
  { city: 'Giza', governorate: 'Giza', latitude: 30.0131, longitude: 31.2089 },
  { city: 'Luxor', governorate: 'Luxor', latitude: 25.6872, longitude: 32.6396 },
  { city: 'Aswan', governorate: 'Aswan', latitude: 24.0889, longitude: 32.8998 },
];