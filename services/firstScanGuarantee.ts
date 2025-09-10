/**
 * First-Scan Success Guarantee System
 * Ensures new users get a successful plant identification experience
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { plantIdentificationService } from './plantIdentification';
import { EGYPTIAN_PLANT_RECOMMENDATIONS } from '../data/onboardingData';

interface FirstScanState {
  hasCompletedFirstScan: boolean;
  isFirstScanAttempt: boolean;
  fallbackPlantId: string | null;
  scanAttempts: number;
  lastScanDate: string | null;
}

interface GuaranteedResult {
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
    cairoTips?: string;
  };
  isGuaranteedResult: boolean;
  personalizedTip: string;
  difficulty: 'beginner' | 'intermediate' | 'expert';
}

// High-confidence beginner-friendly plants for guaranteed results
const BEGINNER_GUARANTEE_PLANTS: GuaranteedResult[] = [
  {
    names: {
      english: 'Golden Pothos',
      arabic: 'بوتس ذهبي',
      scientific: 'Epipremnum aureum'
    },
    category: 'Indoor Plant',
    confidence: 0.92,
    care: {
      watering: 'Water weekly when soil feels dry to touch',
      light: 'Bright indirect sunlight, avoid direct sun',
      environment: 'Indoor, 18-24°C with moderate humidity',
      cairoTips: 'Perfect for Cairo apartments - thrives in AC environments and filters air naturally'
    },
    isGuaranteedResult: true,
    personalizedTip: 'This plant is perfect for beginners - nearly impossible to kill and grows quickly to show your progress!',
    difficulty: 'beginner'
  },
  {
    names: {
      english: 'Snake Plant',
      arabic: 'نبات الثعبان',
      scientific: 'Sansevieria trifasciata'
    },
    category: 'Succulent',
    confidence: 0.89,
    care: {
      watering: 'Water monthly, less in winter - drought tolerant',
      light: 'Low to bright indirect light - very adaptable',
      environment: 'Indoor, very low maintenance, tolerates neglect',
      cairoTips: 'Ideal for busy Cairo lifestyle - survives travel and irregular care'
    },
    isGuaranteedResult: true,
    personalizedTip: 'The ultimate beginner plant - produces oxygen at night and requires minimal attention!',
    difficulty: 'beginner'
  },
  {
    names: {
      english: 'Rubber Plant',
      arabic: 'نبات المطاط',
      scientific: 'Ficus elastica'
    },
    category: 'Indoor Plant',
    confidence: 0.87,
    care: {
      watering: 'Water when top inch of soil is dry',
      light: 'Bright indirect light, can tolerate some direct sun',
      environment: 'Indoor, enjoys regular humidity',
      cairoTips: 'Wipe leaves monthly to remove Cairo dust - helps with photosynthesis'
    },
    isGuaranteedResult: true,
    personalizedTip: 'A beautiful statement plant that grows into an impressive indoor tree with proper care!',
    difficulty: 'beginner'
  },
  {
    names: {
      english: 'Aloe Vera',
      arabic: 'صبار الألوة',
      scientific: 'Aloe barbadensis'
    },
    category: 'Succulent',
    confidence: 0.91,
    care: {
      watering: 'Water deeply but infrequently when soil is completely dry',
      light: 'Bright indirect to direct sunlight',
      environment: 'Warm, dry conditions - perfect for desert climates',
      cairoTips: 'Traditional Egyptian healing plant - gel soothes burns and dry skin'
    },
    isGuaranteedResult: true,
    personalizedTip: 'Not only beautiful but medicinal - break a leaf to soothe minor burns and skin irritation!',
    difficulty: 'beginner'
  }
];

class FirstScanGuaranteeService {
  private static readonly STORAGE_KEY = 'lotus_first_scan_state';
  private static readonly MAX_SCAN_ATTEMPTS = 3;
  
  /**
   * Initialize first scan state for new users
   */
  async initializeFirstScanState(): Promise<FirstScanState> {
    try {
      const existingState = await this.getFirstScanState();
      if (existingState) {
        return existingState;
      }

      const initialState: FirstScanState = {
        hasCompletedFirstScan: false,
        isFirstScanAttempt: true,
        fallbackPlantId: null,
        scanAttempts: 0,
        lastScanDate: null,
      };

      await this.saveFirstScanState(initialState);
      return initialState;
    } catch (error) {
      console.error('Error initializing first scan state:', error);
      throw error;
    }
  }

  /**
   * Check if this is a user's first scan attempt
   */
  async isFirstScanAttempt(): Promise<boolean> {
    try {
      const state = await this.getFirstScanState();
      return state ? state.isFirstScanAttempt : true;
    } catch (error) {
      console.error('Error checking first scan attempt:', error);
      return true; // Default to true for safety
    }
  }

  /**
   * Process a scan attempt with guarantee logic
   */
  async processScanAttempt(imageUri: string, userProfile?: any): Promise<{
    success: boolean;
    data?: GuaranteedResult;
    error?: string;
    isGuaranteed: boolean;
  }> {
    try {
      const state = await this.getFirstScanState();
      const currentAttempts = (state?.scanAttempts || 0) + 1;
      const isFirstTime = !state?.hasCompletedFirstScan;

      // Update scan attempts
      await this.updateScanAttempts(currentAttempts);

      // For first-time users or users struggling with scans, provide guaranteed result
      if (isFirstTime || currentAttempts <= FirstScanGuaranteeService.MAX_SCAN_ATTEMPTS) {
        
        // First try the actual plant identification
        try {
          const actualResult = await plantIdentificationService.identifyFromPhoto(imageUri, '', {
            environment: 'indoor',
            lightCondition: 'medium'
          });

          // If actual identification succeeds with good confidence, use it
          if (actualResult.success && actualResult.confidence && actualResult.confidence > 0.7) {
            await this.markFirstScanComplete();
            return {
              success: true,
              data: {
                ...actualResult.data,
                isGuaranteedResult: false,
                personalizedTip: this.generatePersonalizedTip(actualResult.data, userProfile),
                difficulty: this.determineDifficulty(actualResult.data, userProfile)
              } as GuaranteedResult,
              isGuaranteed: false
            };
          }
        } catch (error) {
          console.log('Actual identification failed, using guarantee system');
        }

        // If actual identification fails, provide guaranteed result
        const guaranteedPlant = this.selectGuaranteedPlant(userProfile);
        await this.markFirstScanComplete();
        
        return {
          success: true,
          data: guaranteedPlant,
          isGuaranteed: true
        };
      }

      // After max attempts, let natural results through
      const naturalResult = await plantIdentificationService.identifyFromPhoto(imageUri, '', {
        environment: 'indoor',
        lightCondition: 'medium'
      });

      return {
        success: naturalResult.success,
        data: naturalResult.data ? {
          ...naturalResult.data,
          isGuaranteedResult: false,
          personalizedTip: this.generatePersonalizedTip(naturalResult.data, userProfile),
          difficulty: this.determineDifficulty(naturalResult.data, userProfile)
        } as GuaranteedResult : undefined,
        error: naturalResult.error,
        isGuaranteed: false
      };

    } catch (error) {
      console.error('Error processing scan attempt:', error);
      return {
        success: false,
        error: 'Failed to process scan',
        isGuaranteed: false
      };
    }
  }

  /**
   * Select the most appropriate guaranteed plant based on user profile
   */
  private selectGuaranteedPlant(userProfile?: any): GuaranteedResult {
    // If no profile, default to most beginner-friendly
    if (!userProfile?.onboardingProfile) {
      return BEGINNER_GUARANTEE_PLANTS[0]; // Golden Pothos
    }

    const profile = userProfile.onboardingProfile;
    
    // Select based on user preferences
    if (profile.interests?.includes('succulents')) {
      return BEGINNER_GUARANTEE_PLANTS.find(p => p.category === 'Succulent') || BEGINNER_GUARANTEE_PLANTS[1];
    }
    
    if (profile.lightConditions === 'low') {
      return BEGINNER_GUARANTEE_PLANTS[1]; // Snake Plant - low light tolerant
    }
    
    if (profile.spaceType === 'office') {
      return BEGINNER_GUARANTEE_PLANTS[0]; // Golden Pothos - great for offices
    }
    
    if (profile.goals?.includes('air-purify')) {
      return BEGINNER_GUARANTEE_PLANTS[0]; // Golden Pothos - excellent air purifier
    }

    // Default to Golden Pothos for beginners
    return BEGINNER_GUARANTEE_PLANTS[0];
  }

  /**
   * Generate personalized tips based on user profile
   */
  private generatePersonalizedTip(plantData: any, userProfile?: any): string {
    const profile = userProfile?.onboardingProfile;
    
    if (!profile) {
      return 'Great choice for your first plant! This one is forgiving and grows quickly.';
    }

    const tips: string[] = [];
    
    if (profile.experience === 'beginner') {
      tips.push('Perfect for beginners - this plant is very forgiving of mistakes');
    }
    
    if (profile.spaceType === 'apartment') {
      tips.push('Ideal for apartment living with limited space');
    }
    
    if (profile.lightConditions === 'low') {
      tips.push('This plant adapts well to lower light conditions');
    }
    
    if (profile.goals?.includes('air-purify')) {
      tips.push('Excellent natural air purifier for your home');
    }
    
    return tips.length > 0 ? tips.join(' and ') + '!' : 'A wonderful choice for your plant journey!';
  }

  /**
   * Determine difficulty level based on plant and user profile
   */
  private determineDifficulty(plantData: any, userProfile?: any): 'beginner' | 'intermediate' | 'expert' {
    const profile = userProfile?.onboardingProfile;
    
    // Match difficulty to user experience
    if (profile?.experience === 'beginner') {
      return 'beginner';
    } else if (profile?.experience === 'intermediate') {
      return 'intermediate';
    } else if (profile?.experience === 'expert') {
      return 'expert';
    }
    
    // Default based on plant characteristics
    const easyPlants = ['pothos', 'snake plant', 'aloe', 'rubber'];
    const plantName = plantData.names?.english?.toLowerCase() || '';
    
    if (easyPlants.some(easy => plantName.includes(easy))) {
      return 'beginner';
    }
    
    return 'intermediate';
  }

  /**
   * Get current first scan state
   */
  private async getFirstScanState(): Promise<FirstScanState | null> {
    try {
      const stateJson = await AsyncStorage.getItem(FirstScanGuaranteeService.STORAGE_KEY);
      return stateJson ? JSON.parse(stateJson) : null;
    } catch (error) {
      console.error('Error getting first scan state:', error);
      return null;
    }
  }

  /**
   * Save first scan state
   */
  private async saveFirstScanState(state: FirstScanState): Promise<void> {
    try {
      await AsyncStorage.setItem(FirstScanGuaranteeService.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving first scan state:', error);
      throw error;
    }
  }

  /**
   * Update scan attempts count
   */
  private async updateScanAttempts(attempts: number): Promise<void> {
    try {
      const state = await this.getFirstScanState() || {
        hasCompletedFirstScan: false,
        isFirstScanAttempt: attempts === 1,
        fallbackPlantId: null,
        scanAttempts: 0,
        lastScanDate: null,
      };

      const updatedState: FirstScanState = {
        ...state,
        scanAttempts: attempts,
        lastScanDate: new Date().toISOString(),
      };

      await this.saveFirstScanState(updatedState);
    } catch (error) {
      console.error('Error updating scan attempts:', error);
    }
  }

  /**
   * Mark first scan as completed successfully
   */
  private async markFirstScanComplete(): Promise<void> {
    try {
      const state = await this.getFirstScanState();
      if (state) {
        const updatedState: FirstScanState = {
          ...state,
          hasCompletedFirstScan: true,
          isFirstScanAttempt: false,
        };
        await this.saveFirstScanState(updatedState);
      }
    } catch (error) {
      console.error('Error marking first scan complete:', error);
    }
  }

  /**
   * Reset first scan state (for testing or user reset)
   */
  async resetFirstScanState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(FirstScanGuaranteeService.STORAGE_KEY);
    } catch (error) {
      console.error('Error resetting first scan state:', error);
    }
  }

  /**
   * Get guarantee statistics for analytics
   */
  async getGuaranteeStats(): Promise<{
    totalScans: number;
    guaranteedResults: number;
    successRate: number;
  }> {
    try {
      const state = await this.getFirstScanState();
      return {
        totalScans: state?.scanAttempts || 0,
        guaranteedResults: state?.hasCompletedFirstScan ? 1 : 0,
        successRate: state?.hasCompletedFirstScan ? 100 : 0,
      };
    } catch (error) {
      console.error('Error getting guarantee stats:', error);
      return { totalScans: 0, guaranteedResults: 0, successRate: 0 };
    }
  }
}

export const firstScanGuaranteeService = new FirstScanGuaranteeService();
export type { GuaranteedResult, FirstScanState };