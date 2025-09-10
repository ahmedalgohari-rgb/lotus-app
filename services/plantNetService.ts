import axios from 'axios';
import * as FileSystem from 'expo-file-system';

// Get your free PlantNet API key from: https://my.plantnet.org/
// Sign up, verify email, then get your API key from the dashboard
const PLANTNET_API_KEY = process.env.EXPO_PUBLIC_PLANTNET_API_KEY || 'YOUR_PLANTNET_API_KEY';
const PLANTNET_API_URL = 'https://my-api.plantnet.org/v2/identify';

interface PlantNetResult {
  score: number;
  species: {
    scientificNameWithoutAuthor: string;
    scientificName: string;
    commonNames: string[];
  };
  gbif?: {
    id: number;
  };
  images: Array<{
    url: {
      o: string;
      m: string;
      s: string;
    };
  }>;
}

interface PlantNetResponse {
  query: {
    project: string;
    images: Array<{
      filename: string;
      organs: string[];
    }>;
    modifiers: string[];
    includeRelatedImages: boolean;
    noReject: boolean;
  };
  language: string;
  preferedReferential: string;
  results: PlantNetResult[];
  version: string;
}

export class PlantNetService {
  static async identifyPlant(imageUri: string, organs: string[] = ['leaf']) {
    try {
      // Convert image to base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create form data
      const formData = new FormData();
      formData.append('images', `data:image/jpeg;base64,${base64}`);
      formData.append('organs', organs.join(','));
      formData.append('include-related-images', 'true');
      formData.append('lang', 'en');
      formData.append('api-key', PLANTNET_API_KEY);

      // Make API request
      const response = await axios.post<PlantNetResponse>(
        `${PLANTNET_API_URL}/all`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 seconds timeout
        }
      );

      // Process results
      if (response.data.results && response.data.results.length > 0) {
        const topResults = response.data.results.slice(0, 3);
        
        return {
          success: true,
          source: 'PlantNet',
          results: topResults.map((result: PlantNetResult) => ({
            confidence: Math.round(result.score * 100),
            scientificName: result.species.scientificNameWithoutAuthor,
            commonNames: result.species.commonNames,
            images: result.images?.slice(0, 3) || [],
            gbifId: result.gbif?.id,
          })),
          bestMatch: {
            confidence: Math.round(topResults[0].score * 100),
            scientificName: topResults[0].species.scientificNameWithoutAuthor,
            commonNames: topResults[0].species.commonNames,
            images: topResults[0].images?.slice(0, 3) || [],
          },
        };
      }

      return {
        success: false,
        error: 'No plants identified',
        source: 'PlantNet',
      };
    } catch (error) {
      console.error('PlantNet API error:', error);
      
      // Check if it's a network error
      if (axios.isAxiosError(error)) {
        if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
          return {
            success: false,
            error: 'Network connection failed',
            source: 'PlantNet',
            fallbackToLocal: true,
          };
        }
        
        if (error.response?.status === 401) {
          return {
            success: false,
            error: 'Invalid API key',
            source: 'PlantNet',
            fallbackToLocal: true,
          };
        }
        
        if (error.response?.status === 429) {
          return {
            success: false,
            error: 'API rate limit exceeded',
            source: 'PlantNet',
            fallbackToLocal: true,
          };
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'PlantNet',
        fallbackToLocal: true,
      };
    }
  }

  /**
   * Check if PlantNet service is available
   */
  static async checkServiceHealth(): Promise<boolean> {
    try {
      // Simple health check - just test the API endpoint
      const response = await axios.get(`${PLANTNET_API_URL}/projects`, {
        timeout: 5000,
        params: {
          'api-key': PLANTNET_API_KEY,
        },
      });
      return response.status === 200;
    } catch (error) {
      console.warn('PlantNet service health check failed:', error);
      return false;
    }
  }

  /**
   * Get available projects from PlantNet
   */
  static async getAvailableProjects() {
    try {
      const response = await axios.get(`${PLANTNET_API_URL}/projects`, {
        params: {
          'api-key': PLANTNET_API_KEY,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get PlantNet projects:', error);
      return [];
    }
  }

  /**
   * Validate image before sending to API
   */
  static async validateImage(imageUri: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const info = await FileSystem.getInfoAsync(imageUri);
      
      if (!info.exists) {
        return { valid: false, error: 'Image file does not exist' };
      }
      
      // Check file size (PlantNet has limits)
      if (info.size && info.size > 10 * 1024 * 1024) { // 10MB limit
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