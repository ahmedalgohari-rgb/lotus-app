import * as FileSystem from 'expo-file-system';
import NetInfo from '@react-native-community/netinfo';
import { PlantNetService } from './plantNetService';
import { FallbackIdentificationService } from './fallbackIdentification';

interface IdentificationResult {
  success: boolean;
  source?: string;
  data?: any;
  results?: any[];
  bestMatch?: any;
  error?: string;
  confidence?: number;
  genericAdvice?: boolean;
  tips?: any[];
  message?: string;
  localData?: boolean;
}

interface ImageProcessingOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export class PlantIdentificationService {
  private defaultProcessingOptions: ImageProcessingOptions = {
    quality: 0.8,
    maxWidth: 800,
    maxHeight: 600,
  };

  /**
   * Main plant identification method with multiple fallback strategies
   */
  static async identifyPlant(imageUri: string): Promise<IdentificationResult> {
    try {
      console.log('Starting plant identification for:', imageUri);
      
      // Step 1: Validate image
      const validation = await PlantNetService.validateImage(imageUri);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || 'Invalid image',
          source: 'Validation',
        };
      }

      // Step 2: Check internet connectivity
      const netInfo = await NetInfo.fetch();
      console.log('Network status:', netInfo.isConnected);
      
      if (netInfo.isConnected) {
        console.log('Network available, trying PlantNet API...');
        
        // Step 3: Try PlantNet API first
        const plantNetResult = await PlantNetService.identifyPlant(imageUri);
        console.log('PlantNet result:', plantNetResult);
        
        if (plantNetResult.success && plantNetResult.results?.[0]?.confidence > 70) {
          console.log('PlantNet identification successful with high confidence');
          return {
            ...plantNetResult,
            source: 'PlantNet API',
          };
        }
        
        // If PlantNet has low confidence or fails, log it but continue to fallback
        if (plantNetResult.success) {
          console.log('PlantNet returned low confidence results, falling back to local database');
        } else {
          console.log('PlantNet failed:', plantNetResult.error);
        }
      } else {
        console.log('No network connection, using offline identification');
      }
      
      // Step 4: Fallback to local database
      console.log('Using local database identification...');
      const localResult = await FallbackIdentificationService.identifyFromLocalDatabase(imageUri);
      console.log('Local database result:', localResult);
      
      if (localResult.success) {
        return localResult;
      }
      
      // Step 5: Last resort - return generic plant care advice
      console.log('All identification methods failed, providing generic advice');
      const genericAdvice = FallbackIdentificationService.getGenericCareAdvice();
      
      return genericAdvice;
      
    } catch (error) {
      console.error('Plant identification failed:', error);
      
      // Emergency fallback to generic advice
      return FallbackIdentificationService.getGenericCareAdvice();
    }
  }

  /**
   * Identify plant from description only
   */
  static async identifyFromDescription(description: string): Promise<IdentificationResult> {
    try {
      console.log('Identifying plant from description:', description);
      
      // Search local database by description
      const searchResults = FallbackIdentificationService.searchPlantsByName(description);
      
      if (searchResults.length > 0) {
        const plant = searchResults[0];
        return {
          success: true,
          source: 'Local Database Search',
          results: [{
            confidence: 85,
            scientificName: plant.scientificName,
            commonNames: [plant.nameEn, plant.nameAr],
            localData: true,
            careInstructions: plant.care,
            difficulty: plant.difficulty,
            category: plant.category,
            cairoTips: plant.care.cairoTips,
          }],
          bestMatch: {
            confidence: 85,
            scientificName: plant.scientificName,
            commonNames: [plant.nameEn, plant.nameAr],
            localData: true,
            careInstructions: plant.care,
          },
          message: `Found match for "${description}" in local database`,
        };
      }
      
      // If no specific match found, return generic advice
      return {
        ...FallbackIdentificationService.getGenericCareAdvice(),
        message: `No specific match found for "${description}". Here's general care advice:`,
      };
      
    } catch (error) {
      console.error('Description-based identification failed:', error);
      return FallbackIdentificationService.getGenericCareAdvice();
    }
  }

  /**
   * Get plant information by scientific name
   */
  static getPlantByScientificName(scientificName: string) {
    return FallbackIdentificationService.getPlantByScientificName(scientificName);
  }

  /**
   * Search plants in local database
   */
  static searchPlants(query: string) {
    return FallbackIdentificationService.searchPlantsByName(query);
  }

  /**
   * Get plants by category
   */
  static getPlantsByCategory(category: string) {
    return FallbackIdentificationService.getPlantsByCategory(category);
  }

  /**
   * Get plants by difficulty level
   */
  static getPlantsByDifficulty(difficulty: 'easy' | 'medium' | 'hard') {
    return FallbackIdentificationService.getPlantsByDifficulty(difficulty);
  }

  /**
   * Check service health for all identification methods
   */
  static async checkServiceHealth() {
    const results = {
      plantNet: false,
      localDatabase: true, // Always available
      network: false,
    };

    try {
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      results.network = netInfo.isConnected || false;

      // Check PlantNet service if network is available
      if (results.network) {
        results.plantNet = await PlantNetService.checkServiceHealth();
      }
    } catch (error) {
      console.error('Service health check failed:', error);
    }

    return results;
  }

  /**
   * Get popular Egyptian plants for quick access
   */
  static getPopularEgyptianPlants() {
    return FallbackIdentificationService.getPlantsByDifficulty('easy').slice(0, 5);
  }

  /**
   * Get all available plants in local database
   */
  static getAllLocalPlants() {
    return FallbackIdentificationService.egyptianPlantsDatabase;
  }

  /**
   * Get plant care tips for Cairo specifically
   */
  static getCairoSpecificTips() {
    return [
      {
        category: 'Watering',
        tip: 'Water more frequently due to dry climate and air conditioning',
        season: 'Year-round'
      },
      {
        category: 'Humidity',
        tip: 'Use humidifiers or pebble trays to increase humidity',
        season: 'Especially in winter'
      },
      {
        category: 'Light',
        tip: 'Protect from intense afternoon sun through windows',
        season: 'Summer months'
      },
      {
        category: 'Dust',
        tip: 'Clean leaves weekly due to dusty environment',
        season: 'Year-round'
      },
      {
        category: 'Temperature',
        tip: 'Keep plants away from direct air conditioning vents',
        season: 'Summer months'
      }
    ];
  }

  /**
   * Process and validate image before identification
   */
  static async processImage(uri: string, options: ImageProcessingOptions = {}): Promise<string> {
    const { quality, maxWidth, maxHeight } = {
      ...new PlantIdentificationService().defaultProcessingOptions,
      ...options,
    };

    try {
      // Get image info
      const imageInfo = await FileSystem.getInfoAsync(uri);
      if (!imageInfo.exists) {
        throw new Error('Image file not found');
      }

      // For now, return the original URI
      // In production, you would implement image resizing and compression
      return uri;
      
    } catch (error) {
      console.error('Image processing failed:', error);
      throw error;
    }
  }

  /**
   * Validate image before processing
   */
  static async validateImage(uri: string): Promise<{ valid: boolean; error?: string }> {
    return await PlantNetService.validateImage(uri);
  }

  /**
   * Get identification confidence thresholds
   */
  static getConfidenceThresholds() {
    return {
      high: 80,      // Very confident identification
      medium: 60,    // Moderately confident
      low: 40,       // Low confidence, show multiple options
      minimum: 20,   // Below this, use generic advice
    };
  }

  /**
   * Format identification result for display
   */
  static formatResultForDisplay(result: IdentificationResult) {
    if (!result.success) {
      return {
        title: 'Identification Failed',
        subtitle: result.error || 'Unable to identify plant',
        showGenericAdvice: true,
      };
    }

    if (result.genericAdvice) {
      return {
        title: 'General Plant Care',
        subtitle: 'We couldn\'t identify your specific plant',
        showGenericAdvice: true,
        tips: result.tips,
      };
    }

    const bestMatch = result.bestMatch || result.results?.[0];
    if (!bestMatch) {
      return {
        title: 'No Results',
        subtitle: 'No plant matches found',
        showGenericAdvice: true,
      };
    }

    return {
      title: bestMatch.commonNames?.[0] || bestMatch.scientificName,
      subtitle: bestMatch.scientificName,
      confidence: bestMatch.confidence,
      source: result.source,
      careInstructions: bestMatch.careInstructions,
      difficulty: bestMatch.difficulty,
      category: bestMatch.category,
      localData: bestMatch.localData,
      alternatives: result.results?.slice(1) || [],
    };
  }
}

// Export singleton instance for backward compatibility
export const plantIdentificationService = new PlantIdentificationService();
export type { IdentificationResult, ImageProcessingOptions };