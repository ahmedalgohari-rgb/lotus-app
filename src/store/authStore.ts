import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../utils/supabase';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

// User type definition
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  provider: 'google' | 'apple' | 'email' | 'guest';
  preferences: {
    language: 'en' | 'ar';
    notifications: boolean;
    measurementUnit: 'metric' | 'imperial';
  };
  createdAt: string;
  avatarUrl?: string;
}

// Authentication store state
interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasSeenOnboarding: boolean;
  isGuest: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasSeenOnboarding: (seen: boolean) => void;
  login: (user: User, tokens: { accessToken: string; refreshToken: string }) => void;
  loginAsGuest: () => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  clearError: () => void;
  
  // Supabase Auth integration methods
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, userData: { firstName: string; lastName: string }) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  initializeAuth: () => void;
}

// Create the auth store with persistence
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      hasSeenOnboarding: false,
      isGuest: false,
      accessToken: null,
      refreshToken: null,
      error: null,

      // Actions
      setUser: (user) => 
        set({ 
          user,
          isAuthenticated: !!user,
          isGuest: user?.provider === 'guest',
        }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setLoading: (isLoading) =>
        set({ isLoading }),

      setError: (error) =>
        set({ error }),

      setHasSeenOnboarding: (hasSeenOnboarding) =>
        set({ hasSeenOnboarding }),

      login: (user, tokens) =>
        set({
          user,
          isAuthenticated: true,
          isGuest: user.provider === 'guest',
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          error: null,
          isLoading: false,
        }),

      loginAsGuest: () => {
        const guestUser: User = {
          id: `guest_${Date.now()}`,
          email: 'guest@lotus.app',
          firstName: 'Guest',
          lastName: 'User',
          provider: 'guest',
          preferences: {
            language: 'en',
            notifications: false,
            measurementUnit: 'metric',
          },
          createdAt: new Date().toISOString(),
        };
        
        set({
          user: guestUser,
          isAuthenticated: true,
          isGuest: true,
          accessToken: null,
          refreshToken: null,
          error: null,
          isLoading: false,
        });
      },

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          isGuest: false,
          accessToken: null,
          refreshToken: null,
          error: null,
          isLoading: false
        }),

      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates },
          });
        }
      },

      clearError: () =>
        set({ error: null }),

      // Supabase Auth integration methods
      signInWithEmail: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (error) throw error;
          if (!data.user) throw new Error('No user data returned');
          
          // Transform Supabase user to our User type
          const lotusUser: User = {
            id: data.user.id,
            email: data.user.email || '',
            firstName: data.user.user_metadata?.firstName || data.user.user_metadata?.full_name?.split(' ')[0] || '',
            lastName: data.user.user_metadata?.lastName || data.user.user_metadata?.full_name?.split(' ')[1] || '',
            provider: 'email',
            preferences: {
              language: 'en',
              notifications: true,
              measurementUnit: 'metric',
            },
            createdAt: data.user.created_at || new Date().toISOString(),
            avatarUrl: data.user.user_metadata?.avatar_url,
          };
          
          set({
            user: lotusUser,
            isAuthenticated: true,
            isGuest: false,
            accessToken: data.session?.access_token || null,
            refreshToken: data.session?.refresh_token || null,
            error: null,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      signUpWithEmail: async (email: string, password: string, userData: { firstName: string; lastName: string }) => {
        try {
          set({ isLoading: true, error: null });
          
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                firstName: userData.firstName,
                lastName: userData.lastName,
                full_name: `${userData.firstName} ${userData.lastName}`,
              },
            },
          });
          
          if (error) throw error;
          if (!data.user) throw new Error('No user data returned');
          
          // Transform Supabase user to our User type
          const lotusUser: User = {
            id: data.user.id,
            email: data.user.email || '',
            firstName: userData.firstName,
            lastName: userData.lastName,
            provider: 'email',
            preferences: {
              language: 'en',
              notifications: true,
              measurementUnit: 'metric',
            },
            createdAt: data.user.created_at || new Date().toISOString(),
          };
          
          set({
            user: lotusUser,
            isAuthenticated: true,
            isGuest: false,
            accessToken: data.session?.access_token || null,
            refreshToken: data.session?.refresh_token || null,
            error: null,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      signInWithGoogle: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: 'exp://localhost:8081', // Expo dev server
            },
          });
          
          if (error) throw error;
          
          // Note: OAuth redirect handling will be managed by auth state listener
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Google sign-in failed',
            isLoading: false,
          });
          throw error;
        }
      },

      signInWithApple: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: {
              redirectTo: 'exp://localhost:8081', // Expo dev server
            },
          });
          
          if (error) throw error;
          
          // Note: OAuth redirect handling will be managed by auth state listener
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Apple sign-in failed',
            isLoading: false,
          });
          throw error;
        }
      },

      signOut: async () => {
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          
          set({
            user: null,
            isAuthenticated: false,
            isGuest: false,
            accessToken: null,
            refreshToken: null,
            error: null,
          });
        } catch (error: any) {
          console.error('Sign out error:', error);
        }
      },

      initializeAuth: () => {
        // Listen to auth state changes
        supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            const lotusUser: User = {
              id: session.user.id,
              email: session.user.email || '',
              firstName: session.user.user_metadata?.firstName || session.user.user_metadata?.full_name?.split(' ')[0] || '',
              lastName: session.user.user_metadata?.lastName || session.user.user_metadata?.full_name?.split(' ')[1] || '',
              provider: (session.user.app_metadata?.provider as 'google' | 'apple' | 'email') || 'email',
              preferences: {
                language: 'en',
                notifications: true,
                measurementUnit: 'metric',
              },
              createdAt: session.user.created_at || new Date().toISOString(),
              avatarUrl: session.user.user_metadata?.avatar_url,
            };
            
            set({
              user: lotusUser,
              isAuthenticated: true,
              isGuest: false,
              accessToken: session.access_token,
              refreshToken: session.refresh_token,
              error: null,
              isLoading: false,
            });
          } else if (event === 'SIGNED_OUT') {
            set({
              user: null,
              isAuthenticated: false,
              isGuest: false,
              accessToken: null,
              refreshToken: null,
              error: null,
              isLoading: false,
            });
          }
        });
      },
    }),
    {
      name: 'lotus-auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist certain fields
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        hasSeenOnboarding: state.hasSeenOnboarding,
        isGuest: state.isGuest,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

// Selector hooks for better performance
export const useUser = (): User | null => useAuthStore((state) => state.user);
export const useIsAuthenticated = (): boolean => useAuthStore((state) => state.isAuthenticated);
export const useIsGuest = (): boolean => useAuthStore((state) => state.isGuest);
export const useAuthLoading = (): boolean => useAuthStore((state) => state.isLoading);
export const useAuthError = (): string | null => useAuthStore((state) => state.error);
export const useHasSeenOnboarding = (): boolean => useAuthStore((state) => state.hasSeenOnboarding);

// Auth actions hook
export const useAuthActions = () => {
  const {
    setUser,
    setTokens,
    setLoading,
    setError,
    setHasSeenOnboarding,
    login,
    loginAsGuest,
    logout,
    updateUser,
    clearError,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
    signOut,
    initializeAuth,
  } = useAuthStore();

  return {
    setUser,
    setTokens,
    setLoading,
    setError,
    setHasSeenOnboarding,
    login,
    loginAsGuest,
    logout,
    updateUser,
    clearError,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
    signOut,
    initializeAuth,
  };
};