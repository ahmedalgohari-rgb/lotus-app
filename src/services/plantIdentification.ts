/**
 * Plant Identification Service
 * Handles plant identification from photos and API integration
 */
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { apiService, PlantIdentificationData, PlantDatabaseItem } from './api';

interface IdentificationResult {
  success: boolean;
  data?: PlantIdentificationData;
  error?: string;
  confidence?: number;
}

interface ImageProcessingOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

class PlantIdentificationService {
  private defaultProcessingOptions: ImageProcessingOptions = {
    quality: 0.8,
    maxWidth: 800,
    maxHeight: 600,
  };

  /**
   * Process and identify plant from camera capture
   */
  async identifyFromPhoto(
    photoUri: string,
    description?: string,
    metadata?: {
      location?: {
        latitude?: number;
        longitude?: number;
      };
      environment?: 'indoor' | 'outdoor';
      lightCondition?: 'low' | 'medium' | 'bright';
    }
  ): Promise<IdentificationResult> {
    try {
      // Process the image
      const processedImageUri = await this.processImage(photoUri);
      
      // For MVP, we'll use description-based identification
      // In production, this would upload the image for AI analysis
      if (!description) {
        description = 'Green plant with leaves'; // Default description
      }

      const identificationData = await apiService.identifyPlant(description, metadata);
      
      return {
        success: true,
        data: identificationData,
        confidence: identificationData.confidence,
      };
      
    } catch (error) {
      console.error('Plant identification failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Identification failed',
      };
    }
  }

  /**
   * Identify plant from description only
   */
  async identifyFromDescription(
    description: string,
    metadata?: {
      location?: {
        latitude?: number;
        longitude?: number;
      };
      environment?: 'indoor' | 'outdoor';
      lightCondition?: 'low' | 'medium' | 'bright';
    }
  ): Promise<IdentificationResult> {
    try {
      const identificationData = await apiService.identifyPlant(description, metadata);
      
      return {
        success: true,
        data: identificationData,
        confidence: identificationData.confidence,
      };
      
    } catch (error) {
      console.error('Plant identification failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Identification failed',
      };
    }
  }

  /**
   * Process image for upload (resize, compress)
   */
  private async processImage(
    uri: string,
    options: ImageProcessingOptions = {}
  ): Promise<string> {
    const { quality, maxWidth, maxHeight } = {
      ...this.defaultProcessingOptions,
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
   * Get plant database for browsing
   */
  async getPlantDatabase(): Promise<PlantDatabaseItem[]> {
    try {
      return await apiService.getPlantDatabase();
    } catch (error) {
      console.error('Failed to fetch plant database:', error);
      throw error;
    }
  }

  /**
   * Search plants by query
   */
  async searchPlants(query: string, limit = 10): Promise<PlantDatabaseItem[]> {
    try {
      return await apiService.searchPlants(query, limit);
    } catch (error) {
      console.error('Plant search failed:', error);
      throw error;
    }
  }

  /**
   * Get care information for a specific plant
   */
  async getPlantCare(plantId: string): Promise<PlantDatabaseItem> {
    try {
      return await apiService.getPlantCare(plantId);
    } catch (error) {
      console.error('Failed to get plant care:', error);
      throw error;
    }
  }

  /**
   * Extract key features from image for description
   * This is a helper method for generating descriptions from images
   */
  extractPlantFeatures(imageUri: string): Promise<string> {
    // This would use image analysis in production
    // For MVP, we return a generic description
    return Promise.resolve('Green plant with leaves');
  }

  /**
   * Generate search suggestions based on partial input
   */
  async getSearchSuggestions(partialQuery: string): Promise<string[]> {
    try {
      const results = await this.searchPlants(partialQuery, 5);
      return results.map(plant => plant.names.english);
    } catch (error) {
      console.error('Failed to get search suggestions:', error);
      return [];
    }
  }

  /**
   * Get popular Egyptian plants for quick access
   */
  async getPopularEgyptianPlants(): Promise<PlantDatabaseItem[]> {
    try {
      // Search for common Egyptian plants
      const searches = ['pothos', 'snake plant', 'aloe', 'mint', 'jasmine'];
      const results: PlantDatabaseItem[] = [];
      
      for (const search of searches) {
        try {
          const plantResults = await this.searchPlants(search, 1);
          if (plantResults.length > 0) {
            results.push(plantResults[0]);
          }
        } catch (error) {
          // Continue if individual search fails
          console.warn(`Failed to search for ${search}:`, error);
        }
      }
      
      return results;
    } catch (error) {
      console.error('Failed to get popular plants:', error);
      return [];
    }
  }

  /**
   * Validate image before processing
   */
  async validateImage(uri: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const imageInfo = await FileSystem.getInfoAsync(uri);
      
      if (!imageInfo.exists) {
        return { valid: false, error: 'Image file not found' };
      }

      // Check file size (limit to 10MB)
      if (imageInfo.size && imageInfo.size > 10 * 1024 * 1024) {
        return { valid: false, error: 'Image file too large (max 10MB)' };
      }

      return { valid: true };
      
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Image validation failed' 
      };
    }
  }
}

export const plantIdentificationService = new PlantIdentificationService();
export type { IdentificationResult, ImageProcessingOptions };