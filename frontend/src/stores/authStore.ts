import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@types/api';
import { apiClient } from '@services/api';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  checkAuthStatus: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login action
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.login({ email, password });
          
          if (response.success && response.data) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error(response.error?.message as string || 'Login failed');
          }
        } catch (error) {
          const errorMessage = apiClient.constructor.getErrorMessage(error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // Register action
      register: async (data) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.register(data);
          
          if (response.success) {
            // Registration successful, but user needs to verify email
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error(response.error?.message as string || 'Registration failed');
          }
        } catch (error) {
          const errorMessage = apiClient.constructor.getErrorMessage(error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // Logout action
      logout: async () => {
        set({ isLoading: true });
        
        try {
          await apiClient.logout();
        } catch (error) {
          // Even if logout API fails, clear local state
          console.error('Logout API error:', error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      // Clear error action
      clearError: () => {
        set({ error: null });
      },

      // Set loading action
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // Check authentication status
      checkAuthStatus: () => {
        const isAuth = apiClient.isAuthenticated();
        const storedUser = apiClient.getStoredUser();
        
        set({
          user: storedUser,
          isAuthenticated: isAuth && !!storedUser,
        });
      },
    }),
    {
      name: 'lotus-auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Helper hooks for specific auth checks
export const useAuth = () => {
  const authStore = useAuthStore();
  return {
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated,
    isLoading: authStore.isLoading,
    error: authStore.error,
  };
};

export const useAuthActions = () => {
  const authStore = useAuthStore();
  return {
    login: authStore.login,
    register: authStore.register,
    logout: authStore.logout,
    clearError: authStore.clearError,
    setLoading: authStore.setLoading,
    checkAuthStatus: authStore.checkAuthStatus,
  };
};