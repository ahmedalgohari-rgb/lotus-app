import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_PLANTS_KEY = 'offline_plants';

interface PlantData {
  id: string;
  nickname: string;
  location: string;
  windowDirection: string;
  // Add other plant properties as needed
}

class StorageService {
  /**
   * Saves plant data to AsyncStorage.
   * @param plants Array of plant data to save.
   */
  async saveOfflinePlants(plants: PlantData[]): Promise<void> {
    try {
      await AsyncStorage.setItem(OFFLINE_PLANTS_KEY, JSON.stringify(plants));
    } catch (error) {
      console.error('Error saving offline plants:', error);
      throw new Error('Failed to save offline plants.');
    }
  }

  /**
   * Loads plant data from AsyncStorage.
   * @returns A promise that resolves to an array of plant data.
   */
  async loadOfflinePlants(): Promise<PlantData[]> {
    try {
      const plants = await AsyncStorage.getItem(OFFLINE_PLANTS_KEY);
      return plants ? JSON.parse(plants) : [];
    } catch (error) {
      console.error('Error loading offline plants:', error);
      throw new Error('Failed to load offline plants.');
    }
  }

  /**
   * Synchronizes offline plant data with the backend.
   * This is a placeholder and needs actual backend integration.
   * @param plantsToSync Array of plant data to synchronize.
   * @returns A promise that resolves when synchronization is complete.
   */
  async syncPlantsWithBackend(plantsToSync: PlantData[]): Promise<void> {
    try {
      console.log('Syncing plants with backend:', plantsToSync);
      // TODO: Implement actual API call to sync plants
      // Example: await api.post('/plants/sync', plantsToSync);
      
      // Clear offline data after successful sync
      await AsyncStorage.removeItem(OFFLINE_PLANTS_KEY);
      console.log('Offline plants synced and cleared.');
    } catch (error) {
      console.error('Error syncing plants with backend:', error);
      throw new Error('Failed to sync plants with backend.');
    }
  }

  /**
   * Clears all offline plant data.
   */
  async clearOfflinePlants(): Promise<void> {
    try {
      await AsyncStorage.removeItem(OFFLINE_PLANTS_KEY);
      console.log('Offline plants cleared.');
    } catch (error) {
      console.error('Error clearing offline plants:', error);
      throw new Error('Failed to clear offline plants.');
    }
  }
}

export const storageService = new StorageService();
export default storageService;
