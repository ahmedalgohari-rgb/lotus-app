import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Plant, PlantSpecies, AppState, WeatherData, CareRecommendation } from '../types';
import { CACHE_KEYS } from '../constants';
import { changeLanguage } from '../i18n';
import { logger } from '../utils/logger';

interface AppStore extends AppState {
  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  signInAsGuest: () => void;
  updateUserName: (firstName: string) => void;
  isFirstVisit: boolean;
  markAsReturningUser: () => void;

  // Language actions
  setLanguage: (language: 'en' | 'ar') => Promise<void>;
  toggleLanguage: () => Promise<void>;
  setIsRTL: (isRTL: boolean) => void;

  // Plant actions
  setPlants: (plants: Plant[]) => void;
  addPlant: (plant: Plant) => void;
  updatePlant: (id: string, updates: Partial<Plant>) => void;
  deletePlant: (id: string) => void;

  // Species actions
  setSpecies: (species: PlantSpecies[]) => void;

  // Weather actions
  setWeather: (weather: WeatherData) => void;

  // Care recommendations actions
  setCareRecommendations: (recommendations: CareRecommendation[]) => void;
  addCareRecommendation: (recommendation: CareRecommendation) => void;

  // Persistence
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
  clearStorage: () => Promise<void>;
}

export const useStore = create<AppStore>((set, get) => ({
  // Initial state
  user: null,
  plants: [],
  species: [],
  isLoading: false,
  isAuthenticated: false,
  isGuest: false,
  language: 'en',
  isRTL: false,
  weather: null,
  careRecommendations: [],
  isFirstVisit: true, // Default to true for new users

  // User actions
  setUser: (user) => {
    set({ user });
    get().saveToStorage();
  },

  setAuthenticated: (isAuthenticated) => {
    if (isAuthenticated) {
      set({ isAuthenticated, isGuest: false });
    } else {
      set({ isAuthenticated });
    }
  },

  signInAsGuest: async () => {
    // Clear any cached authenticated user data
    await AsyncStorage.removeItem(CACHE_KEYS.USER_PROFILE);
    await AsyncStorage.removeItem(CACHE_KEYS.USER_PLANTS);

    set({
      isGuest: true,
      isAuthenticated: false,
      user: null, // No user object for guests
      plants: [], // No cached plants for guests
      isFirstVisit: true,
    });
    // Don't save to storage for guests
  },

  updateUserName: (firstName) => {
    const { user } = get();
    if (user) {
      const updatedUser = {
        ...user,
        first_name: firstName,
        name: user.name || firstName, // Also update name if it doesn't exist
      };
      set({ user: updatedUser });
      get().saveToStorage();
    }
  },

  markAsReturningUser: () => {
    set({ isFirstVisit: false });
    AsyncStorage.setItem('has_visited_before', 'true');
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  // Language actions
  setLanguage: async (language) => {
    await changeLanguage(language);
    set({ 
      language, 
      isRTL: language === 'ar' 
    });
    get().saveToStorage();
  },

  toggleLanguage: async () => {
    const { language } = get();
    const newLanguage = language === 'en' ? 'ar' : 'en';
    await get().setLanguage(newLanguage);
  },

  setIsRTL: (isRTL) => {
    set({ isRTL });
  },

  // Plant actions
  setPlants: (plants) => {
    set({ plants });
    get().saveToStorage();
  },

  addPlant: (plant) => {
    const { plants, user } = get();
    
    // Guest mode: limit to 1 plant stored locally only
    if (!user && plants.length >= 1) {
      // Remove existing plant for guests and add new one
      const newPlants = [plant];
      set({ plants: newPlants });
      get().saveToStorage();
      return;
    }
    
    const newPlants = [...plants, plant];
    set({ plants: newPlants });
    get().saveToStorage();
  },

  updatePlant: (id, updates) => {
    const { plants } = get();
    const newPlants = plants.map(plant => 
      plant.id === id ? { ...plant, ...updates } : plant
    );
    set({ plants: newPlants });
    get().saveToStorage();
  },

  deletePlant: (id) => {
    const { plants } = get();
    const newPlants = plants.filter(plant => plant.id !== id);
    set({ plants: newPlants });
    get().saveToStorage();
  },

  // Species actions
  setSpecies: (species) => {
    set({ species });
    // Species data doesn't change often, cache separately
    AsyncStorage.setItem(CACHE_KEYS.PLANT_SPECIES, JSON.stringify(species));
  },

  // Weather actions
  setWeather: (weather) => {
    set({ weather });
  },

  // Care recommendations actions
  setCareRecommendations: (careRecommendations) => {
    set({ careRecommendations });
  },

  addCareRecommendation: (recommendation) => {
    const { careRecommendations } = get();
    set({ careRecommendations: [...careRecommendations, recommendation] });
  },

  // Persistence
  loadFromStorage: async () => {
    try {
      const { isGuest } = get();

      // Don't load cached user data for guest users
      if (isGuest) {
        // Only load language preference for guests
        const languageData = await AsyncStorage.getItem('user-language');
        if (languageData) {
          const language = languageData as 'en' | 'ar';
          set({
            language,
            isRTL: language === 'ar'
          });
          await changeLanguage(language);
        }
        return;
      }

      const [userPlantsData, userProfileData, speciesData, languageData, hasVisitedBefore] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEYS.USER_PLANTS),
        AsyncStorage.getItem(CACHE_KEYS.USER_PROFILE),
        AsyncStorage.getItem(CACHE_KEYS.PLANT_SPECIES),
        AsyncStorage.getItem('user-language'),
        AsyncStorage.getItem('has_visited_before'),
      ]);

      if (userPlantsData) {
        const plants = JSON.parse(userPlantsData);
        set({ plants });
      }

      if (userProfileData) {
        const user = JSON.parse(userProfileData);
        set({ user });
      }

      if (speciesData) {
        const species = JSON.parse(speciesData);
        set({ species });
      }

      if (languageData) {
        const language = languageData as 'en' | 'ar';
        set({
          language,
          isRTL: language === 'ar'
        });
        await changeLanguage(language);
      }

      // Check if user has visited before
      if (hasVisitedBefore === 'true') {
        set({ isFirstVisit: false });
      }
    } catch (error) {
      logger.error('Error loading from storage:', error);
    }
  },

  saveToStorage: async () => {
    try {
      const { user, plants, isGuest } = get();

      // Don't cache data for guest users
      if (isGuest) {
        return;
      }

      await Promise.all([
        AsyncStorage.setItem(CACHE_KEYS.USER_PLANTS, JSON.stringify(plants)),
        user ? AsyncStorage.setItem(CACHE_KEYS.USER_PROFILE, JSON.stringify(user)) : null,
      ]);
    } catch (error) {
      logger.error('Error saving to storage:', error);
    }
  },

  clearStorage: async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(CACHE_KEYS.USER_PLANTS),
        AsyncStorage.removeItem(CACHE_KEYS.USER_PROFILE),
        AsyncStorage.removeItem(CACHE_KEYS.PLANT_SPECIES),
        AsyncStorage.removeItem('user-language'),
        AsyncStorage.removeItem('has_visited_before'),
      ]);

      set({
        user: null,
        plants: [],
        species: [],
        isAuthenticated: false,
        isGuest: false,
        language: 'en',
        isRTL: false,
        weather: null,
        careRecommendations: [],
        isFirstVisit: true, // Reset to first visit on logout
      });
    } catch (error) {
      logger.error('Error clearing storage:', error);
    }
  },
}));

// Initialize store on app start
export const initializeStore = async () => {
  await useStore.getState().loadFromStorage();
};