import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Plant, PlantSpecies, AppState, WeatherData, CareRecommendation } from '../types';
import { CACHE_KEYS } from '../constants';
import { changeLanguage } from '../i18n';
import { logger } from '../utils/logger';

type Season = 'summer' | 'winter' | 'spring' | 'fall';

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

  // Seasonal care recalculation
  lastKnownSeason: Season | null;
  setLastKnownSeason: (season: Season) => void;
  checkSeasonChange: () => Promise<boolean>;  // Returns true if season changed

  // Garden location
  gardenLocation: { lat: number; lon: number; name: string } | null;
  setGardenLocation: (location: { lat: number; lon: number; name: string } | null) => void;

  // Persistence
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
  clearStorage: () => Promise<void>;
}

// Helper function to detect current season using official astronomical dates
const getCurrentSeason = (): Season => {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const day = now.getDate();

  // Official astronomical season dates (Egypt/Northern Hemisphere)
  // Winter: Dec 21 - Mar 20
  // Spring: Mar 21 - Jun 20
  // Summer: Jun 21 - Sep 22
  // Autumn/Fall: Sep 23 - Dec 20

  if ((month === 11 && day >= 21) || month === 0 || month === 1 || (month === 2 && day <= 20)) {
    return 'winter'; // Dec 21 - Mar 20
  }
  if ((month === 2 && day >= 21) || month === 3 || month === 4 || (month === 5 && day <= 20)) {
    return 'spring'; // Mar 21 - Jun 20
  }
  if ((month === 5 && day >= 21) || month === 6 || month === 7 || (month === 8 && day <= 22)) {
    return 'summer'; // Jun 21 - Sep 22
  }
  return 'fall'; // Sep 23 - Dec 20
};

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
  lastKnownSeason: null,  // Will be set on first app open
  gardenLocation: null,

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

  // Seasonal care recalculation
  setLastKnownSeason: (season) => {
    set({ lastKnownSeason: season });
    AsyncStorage.setItem('last_known_season', season);
    logger.debug('Season saved', { season });
  },

  checkSeasonChange: async () => {
    const { lastKnownSeason } = get();
    const currentSeason = getCurrentSeason();

    // First time app opened - store current season
    if (!lastKnownSeason) {
      get().setLastKnownSeason(currentSeason);
      logger.info('First season detection', { season: currentSeason });
      return false;  // No change (first time)
    }

    // Season changed - return true to trigger recalculation
    if (currentSeason !== lastKnownSeason) {
      logger.info('Season changed!', {
        from: lastKnownSeason,
        to: currentSeason
      });
      get().setLastKnownSeason(currentSeason);
      return true;  // Season changed
    }

    return false;  // No change
  },

  // Garden location
  setGardenLocation: (location) => {
    set({ gardenLocation: location });
    if (location) {
      AsyncStorage.setItem('garden_location', JSON.stringify(location));
    } else {
      AsyncStorage.removeItem('garden_location');
    }
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

      const [userPlantsData, userProfileData, speciesData, languageData, hasVisitedBefore, lastSeasonData, gardenLocationData] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEYS.USER_PLANTS),
        AsyncStorage.getItem(CACHE_KEYS.USER_PROFILE),
        AsyncStorage.getItem(CACHE_KEYS.PLANT_SPECIES),
        AsyncStorage.getItem('user-language'),
        AsyncStorage.getItem('has_visited_before'),
        AsyncStorage.getItem('last_known_season'),
        AsyncStorage.getItem('garden_location'),
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

      // Load last known season
      if (lastSeasonData) {
        set({ lastKnownSeason: lastSeasonData as Season });
      }

      // Load garden location
      if (gardenLocationData) {
        try {
          set({ gardenLocation: JSON.parse(gardenLocationData) });
        } catch { /* ignore parse errors */ }
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
        AsyncStorage.removeItem('last_known_season'),
        AsyncStorage.removeItem('garden_location'),
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
        lastKnownSeason: null,  // Reset season on logout
        gardenLocation: null,
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