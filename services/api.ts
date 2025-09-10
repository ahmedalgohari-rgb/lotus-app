/**
 * Lotus API Service
 * Connects to backend API endpoints
 */
import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || (__DEV__ ? 'http://localhost:3000/api' : 'https://your-production-api.com/api');

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

interface PlantIdentificationData {
  names: {
    english: string;
    arabic: string;
    scientific: string;
  };
  category: string;
  confidence: number;
  care: {
    watering: string;
    light: string;
    environment: string;
    careInstructions: string[];
    cairoTips?: string;
  };
}

interface PlantDatabaseItem {
  id: string;
  names: {
    english: string;
    arabic: string;
    scientific: string;
  };
  category: string;
  care: {
    watering: string;
    light: string;
    environment: string;
    careInstructions: string[];
    cairoTips?: string;
  };
}

// User Plant Management Interfaces
interface UserPlant {
  id: string;
  userId: string;
  names: {
    english: string;
    arabic: string;
    scientific: string;
  };
  nickName?: string;
  category: string;
  location: string;
  healthStatus: 'HEALTHY' | 'NEEDS_ATTENTION' | 'CRITICAL';
  plantedDate?: string;
  lastWateredDate?: string;
  nextWateringDate?: string;
  imageUrl?: string;
  notes?: string;
  care: {
    watering: string;
    light: string;
    environment: string;
    careInstructions: string[];
    cairoTips?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CreateUserPlantData {
  names: {
    english: string;
    arabic: string;
    scientific: string;
  };
  nickName?: string;
  category: string;
  location: string;
  plantedDate?: string;
  imageUrl?: string;
  notes?: string;
  care: {
    watering: string;
    light: string;
    environment: string;
    careInstructions: string[];
    cairoTips?: string;
  };
}

interface UpdateUserPlantData {
  nickName?: string;
  location?: string;
  healthStatus?: 'HEALTHY' | 'NEEDS_ATTENTION' | 'CRITICAL';
  plantedDate?: string;
  lastWateredDate?: string;
  imageUrl?: string;
  notes?: string;
}

interface PlantStats {
  totalPlants: number;
  healthyPlants: number;
  plantsNeedingAttention: number;
  criticalPlants: number;
  plantsWateredToday: number;
  plantsWateredThisWeek: number;
  overdueWatering: number;
}

// Care Logging Interfaces
interface CareLog {
  id: string;
  userId: string;
  plantId: string;
  type: 'WATERING' | 'FERTILIZING' | 'PRUNING' | 'REPOTTING' | 'OBSERVATION';
  notes?: string;
  metadata?: string;
  imageUrl?: string;
  performedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateCareLogData {
  plantId: string;
  type: 'WATERING' | 'FERTILIZING' | 'PRUNING' | 'REPOTTING' | 'OBSERVATION';
  notes?: string;
  metadata?: string;
  imageUrl?: string;
  performedAt?: string;
}

interface UpdateCareLogData {
  type?: 'WATERING' | 'FERTILIZING' | 'PRUNING' | 'REPOTTING' | 'OBSERVATION';
  notes?: string;
  metadata?: string;
  imageUrl?: string;
  performedAt?: string;
}

interface CareStats {
  totalActions: number;
  wateringActions: number;
  fertilizingActions: number;
  pruningActions: number;
  repottingActions: number;
  observationActions: number;
  actionsThisWeek: number;
  actionsThisMonth: number;
}

class ApiService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  // Initialize the API service with current auth token
  initialize() {
    const token = useAuthStore.getState().accessToken;
    this.setAuthToken(token);
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Always get the latest token from the store
    const currentToken = useAuthStore.getState().accessToken;
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Plant Identification API Methods
  async identifyPlant(
    description: string,
    metadata?: {
      location?: {
        latitude?: number;
        longitude?: number;
      };
      environment?: 'indoor' | 'outdoor';
      lightCondition?: 'low' | 'medium' | 'bright';
    }
  ): Promise<PlantIdentificationData> {
    const response = await this.makeRequest<{
      identification: PlantIdentificationData;
      metadata: any;
    }>('/identify', {
      method: 'POST',
      body: JSON.stringify({
        description,
        metadata,
      }),
    });

    if (!response.success || !response.data) {
      throw new Error('Plant identification failed');
    }

    return response.data.identification;
  }

  async getPlantDatabase(): Promise<PlantDatabaseItem[]> {
    const response = await this.makeRequest<{
      plants: PlantDatabaseItem[];
      count: number;
    }>('/identify/database');

    if (!response.success || !response.data) {
      throw new Error('Failed to fetch plant database');
    }

    return response.data.plants;
  }

  async searchPlants(query: string, limit = 10): Promise<PlantDatabaseItem[]> {
    const response = await this.makeRequest<{
      plants: PlantDatabaseItem[];
      count: number;
      query: string;
    }>(`/identify/search?query=${encodeURIComponent(query)}&limit=${limit}`);

    if (!response.success || !response.data) {
      throw new Error('Plant search failed');
    }

    return response.data.plants;
  }

  async getPlantCare(plantId: string): Promise<PlantDatabaseItem> {
    const response = await this.makeRequest<{
      plant: PlantDatabaseItem;
      plantId: string;
    }>(`/identify/care/${plantId}`);

    if (!response.success || !response.data) {
      throw new Error('Failed to get plant care information');
    }

    return response.data.plant;
  }

  async getDatabaseStats(): Promise<{
    totalPlants: number;
    categories: { [key: string]: number };
    lastUpdated: string;
  }> {
    const response = await this.makeRequest<{
      stats: {
        totalPlants: number;
        categories: { [key: string]: number };
        lastUpdated: string;
      };
    }>('/identify/stats');

    if (!response.success || !response.data) {
      throw new Error('Failed to get database stats');
    }

    return response.data.stats;
  }

  // User Plant Management API Methods
  async getUserPlants(): Promise<UserPlant[]> {
    const response = await this.makeRequest<{
      plants: UserPlant[];
      count: number;
    }>('/plants');

    if (!response.success || !response.data) {
      throw new Error('Failed to get user plants');
    }

    return response.data.plants;
  }

  async createUserPlant(plantData: CreateUserPlantData): Promise<UserPlant> {
    const response = await this.makeRequest<{
      plant: UserPlant;
    }>('/plants', {
      method: 'POST',
      body: JSON.stringify(plantData),
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to create plant');
    }

    return response.data.plant;
  }

  async getUserPlant(plantId: string): Promise<UserPlant> {
    const response = await this.makeRequest<{
      plant: UserPlant;
    }>(`/plants/${plantId}`);

    if (!response.success || !response.data) {
      throw new Error('Failed to get plant');
    }

    return response.data.plant;
  }

  async updateUserPlant(plantId: string, updates: UpdateUserPlantData): Promise<UserPlant> {
    const response = await this.makeRequest<{
      plant: UserPlant;
    }>(`/plants/${plantId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to update plant');
    }

    return response.data.plant;
  }

  async deleteUserPlant(plantId: string): Promise<void> {
    const response = await this.makeRequest(`/plants/${plantId}`, {
      method: 'DELETE',
    });

    if (!response.success) {
      throw new Error('Failed to delete plant');
    }
  }

  async getUserPlantStats(): Promise<PlantStats> {
    const response = await this.makeRequest<{
      stats: PlantStats;
    }>('/plants/stats');

    if (!response.success || !response.data) {
      throw new Error('Failed to get plant stats');
    }

    return response.data.stats;
  }

  // Care Logging API Methods
  async logCareAction(careData: CreateCareLogData): Promise<CareLog> {
    const response = await this.makeRequest<{
      careLog: CareLog;
    }>('/care', {
      method: 'POST',
      body: JSON.stringify(careData),
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to log care action');
    }

    return response.data.careLog;
  }

  async getPlantCareHistory(plantId: string, limit = 20): Promise<CareLog[]> {
    const response = await this.makeRequest<{
      careHistory: CareLog[];
      count: number;
    }>(`/care/plant/${plantId}?limit=${limit}`);

    if (!response.success || !response.data) {
      throw new Error('Failed to get care history');
    }

    return response.data.careHistory;
  }

  async getRecentCareActions(limit = 10): Promise<CareLog[]> {
    const response = await this.makeRequest<{
      recentActions: CareLog[];
      count: number;
    }>(`/care/recent?limit=${limit}`);

    if (!response.success || !response.data) {
      throw new Error('Failed to get recent care actions');
    }

    return response.data.recentActions;
  }

  async getCareStats(days = 30): Promise<CareStats> {
    const response = await this.makeRequest<{
      stats: CareStats;
    }>(`/care/stats?days=${days}`);

    if (!response.success || !response.data) {
      throw new Error('Failed to get care stats');
    }

    return response.data.stats;
  }

  async getCareLog(careLogId: string): Promise<CareLog> {
    const response = await this.makeRequest<{
      careLog: CareLog;
    }>(`/care/${careLogId}`);

    if (!response.success || !response.data) {
      throw new Error('Failed to get care log');
    }

    return response.data.careLog;
  }

  async updateCareLog(careLogId: string, updates: UpdateCareLogData): Promise<CareLog> {
    const response = await this.makeRequest<{
      careLog: CareLog;
    }>(`/care/${careLogId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to update care log');
    }

    return response.data.careLog;
  }

  async deleteCareLog(careLogId: string): Promise<void> {
    const response = await this.makeRequest(`/care/${careLogId}`, {
      method: 'DELETE',
    });

    if (!response.success) {
      throw new Error('Failed to delete care log');
    }
  }

  // Authentication API Methods (for future backend integration)
  async login(email: string, password: string): Promise<{
    user: any;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  }> {
    const response = await this.makeRequest<{
      user: any;
      tokens: {
        accessToken: string;
        refreshToken: string;
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!response.success || !response.data) {
      throw new Error('Login failed');
    }

    return response.data;
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<{
    user: any;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  }> {
    const response = await this.makeRequest<{
      user: any;
      tokens: {
        accessToken: string;
        refreshToken: string;
      };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (!response.success || !response.data) {
      throw new Error('Registration failed');
    }

    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const response = await this.makeRequest<{
      tokens: {
        accessToken: string;
        refreshToken: string;
      };
    }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.success || !response.data) {
      throw new Error('Token refresh failed');
    }

    return response.data.tokens;
  }
}

export const apiService = new ApiService();
export type { 
  PlantIdentificationData, 
  PlantDatabaseItem, 
  UserPlant, 
  CreateUserPlantData, 
  UpdateUserPlantData,
  PlantStats,
  CareLog,
  CreateCareLogData,
  UpdateCareLogData,
  CareStats
};