import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Plant, PlantSpecies, AppState } from '../types';
import { CACHE_KEYS } from '../constants';

interface AppStore extends AppState {
  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  
  // Plant actions
  setPlants: (plants: Plant[]) => void;
  addPlant: (plant: Plant) => void;
  updatePlant: (id: string, updates: Partial<Plant>) => void;
  deletePlant: (id: string) => void;
  
  // Species actions
  setSpecies: (species: PlantSpecies[]) => void;
  
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

  // User actions
  setUser: (user) => {
    set({ user });
    get().saveToStorage();
  },

  setAuthenticated: (isAuthenticated) => {
    set({ isAuthenticated });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  // Plant actions
  setPlants: (plants) => {
    set({ plants });
    get().saveToStorage();
  },

  addPlant: (plant) => {
    const { plants } = get();
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

  // Persistence
  loadFromStorage: async () => {
    try {
      const [userPlantsData, userProfileData, speciesData] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEYS.USER_PLANTS),
        AsyncStorage.getItem(CACHE_KEYS.USER_PROFILE),
        AsyncStorage.getItem(CACHE_KEYS.PLANT_SPECIES),
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
    } catch (error) {
      console.error('Error loading from storage:', error);
    }
  },

  saveToStorage: async () => {
    try {
      const { user, plants } = get();
      
      await Promise.all([
        AsyncStorage.setItem(CACHE_KEYS.USER_PLANTS, JSON.stringify(plants)),
        user ? AsyncStorage.setItem(CACHE_KEYS.USER_PROFILE, JSON.stringify(user)) : null,
      ]);
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  },

  clearStorage: async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(CACHE_KEYS.USER_PLANTS),
        AsyncStorage.removeItem(CACHE_KEYS.USER_PROFILE),
        AsyncStorage.removeItem(CACHE_KEYS.PLANT_SPECIES),
      ]);
      
      set({
        user: null,
        plants: [],
        species: [],
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
}));

// Initialize store on app start
export const initializeStore = async () => {
  await useStore.getState().loadFromStorage();
};