import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
  Plant,
  CreatePlantRequest,
  UpdatePlantRequest,
  PlantStats,
  CareLog,
  CreateCareLogRequest,
  CareStats,
  IdentifyPlantRequest,
  IdentifyPlantResponse,
  DatabasePlant,
  PaginatedResponse,
} from '@types/api';

// API Base Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000, // 10 seconds timeout for Egyptian mobile networks
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Try to refresh token
          const refreshed = await this.tryRefreshToken();
          if (refreshed && error.config) {
            // Retry original request
            return this.client.request(error.config);
          } else {
            // Redirect to login
            this.clearStoredTokens();
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Token Management
  private getStoredToken(): string | null {
    return localStorage.getItem('lotus_access_token');
  }

  private getStoredRefreshToken(): string | null {
    return localStorage.getItem('lotus_refresh_token');
  }

  private setStoredTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('lotus_access_token', accessToken);
    localStorage.setItem('lotus_refresh_token', refreshToken);
  }

  private clearStoredTokens(): void {
    localStorage.removeItem('lotus_access_token');
    localStorage.removeItem('lotus_refresh_token');
    localStorage.removeItem('lotus_user');
  }

  private async tryRefreshToken(): Promise<boolean> {
    const refreshToken = this.getStoredRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });
      
      if (response.data.success) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
        this.setStoredTokens(accessToken, newRefreshToken);
        return true;
      }
    } catch {
      // Refresh failed
    }
    return false;
  }

  // Device ID for authentication
  private getDeviceId(): string {
    let deviceId = localStorage.getItem('lotus_device_id');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('lotus_device_id', deviceId);
    }
    return deviceId;
  }

  // Authentication API
  async register(data: Omit<RegisterRequest, 'deviceId'>): Promise<ApiResponse<{ user: User }>> {
    const response = await this.client.post('/auth/register', {
      ...data,
      deviceId: this.getDeviceId(),
    });
    return response.data;
  }

  async login(data: Omit<LoginRequest, 'deviceId'>): Promise<ApiResponse<LoginResponse>> {
    const response = await this.client.post('/auth/login', {
      ...data,
      deviceId: this.getDeviceId(),
    });
    
    if (response.data.success && response.data.data) {
      const { tokens, user } = response.data.data;
      this.setStoredTokens(tokens.accessToken, tokens.refreshToken);
      localStorage.setItem('lotus_user', JSON.stringify(user));
    }
    
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } finally {
      this.clearStoredTokens();
    }
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Plant Management API
  async getPlants(): Promise<ApiResponse<PaginatedResponse<Plant>>> {
    const response = await this.client.get('/plants');
    return response.data;
  }

  async getPlant(id: string): Promise<ApiResponse<{ plant: Plant }>> {
    const response = await this.client.get(`/plants/${id}`);
    return response.data;
  }

  async createPlant(data: CreatePlantRequest): Promise<ApiResponse<{ plant: Plant }>> {
    const response = await this.client.post('/plants', data);
    return response.data;
  }

  async updatePlant(id: string, data: UpdatePlantRequest): Promise<ApiResponse<{ plant: Plant }>> {
    const response = await this.client.put(`/plants/${id}`, data);
    return response.data;
  }

  async deletePlant(id: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(`/plants/${id}`);
    return response.data;
  }

  async getPlantStats(): Promise<ApiResponse<{ stats: PlantStats }>> {
    const response = await this.client.get('/plants/stats');
    return response.data;
  }

  // Care Logging API
  async logCareAction(data: CreateCareLogRequest): Promise<ApiResponse<{ careLog: CareLog }>> {
    const response = await this.client.post('/care', data);
    return response.data;
  }

  async getPlantCareHistory(plantId: string, limit = 20): Promise<ApiResponse<PaginatedResponse<CareLog>>> {
    const response = await this.client.get(`/care/plant/${plantId}?limit=${limit}`);
    return response.data;
  }

  async getRecentCareActions(limit = 10): Promise<ApiResponse<PaginatedResponse<CareLog>>> {
    const response = await this.client.get(`/care/recent?limit=${limit}`);
    return response.data;
  }

  async getCareStats(days = 30): Promise<ApiResponse<{ stats: CareStats }>> {
    const response = await this.client.get(`/care/stats?days=${days}`);
    return response.data;
  }

  async updateCareLog(id: string, data: Partial<CreateCareLogRequest>): Promise<ApiResponse<{ careLog: CareLog }>> {
    const response = await this.client.put(`/care/${id}`, data);
    return response.data;
  }

  async deleteCareLog(id: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(`/care/${id}`);
    return response.data;
  }

  // Plant Identification API
  async identifyPlant(data: IdentifyPlantRequest): Promise<ApiResponse<IdentifyPlantResponse>> {
    const response = await this.client.post('/identify', data);
    return response.data;
  }

  async getPlantDatabase(): Promise<ApiResponse<PaginatedResponse<DatabasePlant>>> {
    const response = await this.client.get('/identify/database');
    return response.data;
  }

  async searchPlants(query: string, limit = 10): Promise<ApiResponse<PaginatedResponse<DatabasePlant>>> {
    const response = await this.client.get(`/identify/search?query=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  }

  async getDatabaseStats(): Promise<ApiResponse<{ stats: any }>> {
    const response = await this.client.get('/identify/stats');
    return response.data;
  }

  async getPlantCareInfo(plantId: string): Promise<ApiResponse<{ plant: DatabasePlant; plantId: string }>> {
    const response = await this.client.get(`/identify/care/${plantId}`);
    return response.data;
  }

  // Helper Methods
  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('lotus_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Error Helper
  static isApiError(error: unknown): error is AxiosError {
    return axios.isAxiosError(error);
  }

  static getErrorMessage(error: unknown): string {
    if (this.isApiError(error)) {
      const apiError = error.response?.data?.error;
      if (apiError?.message) {
        if (typeof apiError.message === 'string') {
          return apiError.message;
        } else if (apiError.message.en) {
          return apiError.message.en; // Default to English
        }
      }
      return error.message;
    }
    return 'An unexpected error occurred';
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;