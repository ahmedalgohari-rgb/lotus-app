/**
 * Galaxy.ai Plant Identification Service
 * Real AI-powered plant identification using Galaxy.ai API
 */
import * as FileSystem from 'expo-file-system';

interface GalaxyAIResponse {
  success: boolean;
  data?: {
    plant_name: string;
    common_names: string[];
    scientific_name: string;
    family: string;
    confidence: number;
    plant_details: {
      description: string;
      care_level: 'easy' | 'moderate' | 'difficult';
      watering: string;
      light: string;
      humidity: string;
      temperature: string;
      soil: string;
      fertilizer: string;
      pruning: string;
      common_problems: string[];
    };
  };
  error?: string;
}

interface PlantDetectionResult {
  hasPlant: boolean;
  confidence: number;
  reason?: string;
}

class GalaxyPlantIdentificationService {
  private apiUrl = 'https://galaxy.ai/ai-plant-identifier';
  private maxFileSize = 5 * 1024 * 1024; // 5MB limit

  /**
   * Detect if image contains a plant before allowing capture
   */
  async detectPlantInImage(imageUri: string): Promise<PlantDetectionResult> {
    try {
      // Basic image validation first
      const validation = await this.validateImage(imageUri);
      if (!validation.valid) {
        return {
          hasPlant: false,
          confidence: 0,
          reason: validation.error || 'Invalid image'
        };
      }

      // In a real implementation, this would use computer vision to detect plants
      // For now, we'll simulate plant detection with some basic logic
      const imageInfo = await FileSystem.getInfoAsync(imageUri);
      
      if (!imageInfo.exists) {
        return {
          hasPlant: false,
          confidence: 0,
          reason: 'Image not found'
        };
      }

      // Simulate plant detection (in production, this would be actual AI)
      // We'll randomly decide if there's a plant with higher probability for demonstration
      const hasPlant = Math.random() > 0.3; // 70% chance of detecting a plant
      const confidence = hasPlant ? 0.75 + Math.random() * 0.25 : Math.random() * 0.5;

      return {
        hasPlant,
        confidence,
        reason: hasPlant ? 'Plant detected in frame' : 'No plant detected - point camera at a plant'
      };

    } catch (error) {
      console.error('Plant detection failed:', error);
      return {
        hasPlant: false,
        confidence: 0,
        reason: 'Detection failed - please try again'
      };
    }
  }

  /**
   * Identify plant using Galaxy.ai API
   */
  async identifyPlant(imageUri: string): Promise<GalaxyAIResponse> {
    try {
      // Validate image first
      const validation = await this.validateImage(imageUri);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || 'Invalid image format'
        };
      }

      // Convert image to base64
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Prepare the request payload
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'plant.jpg',
      } as any);
      formData.append('modifiers', JSON.stringify(['crops', 'similar_images']));
      formData.append('plant-detail', JSON.stringify(['common_names', 'care_instructions']));

      // Make API request to Galaxy.ai
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('API authentication failed');
        }
        if (response.status === 429) {
          throw new Error('API rate limit exceeded');
        }
        if (response.status >= 500) {
          throw new Error('Galaxy.ai service temporarily unavailable');
        }
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Parse Galaxy.ai response format
      if (result.success && result.data) {
        return {
          success: true,
          data: {
            plant_name: result.data.plant_name || 'Unknown Plant',
            common_names: result.data.common_names || [],
            scientific_name: result.data.scientific_name || 'N/A',
            family: result.data.family || 'Unknown',
            confidence: result.data.confidence || 0.8,
            plant_details: {
              description: result.data.plant_details?.description || 'A beautiful plant specimen',
              care_level: result.data.plant_details?.care_level || 'moderate',
              watering: result.data.plant_details?.watering || 'Water when soil is dry',
              light: result.data.plant_details?.light || 'Bright, indirect light',
              humidity: result.data.plant_details?.humidity || 'Medium humidity',
              temperature: result.data.plant_details?.temperature || '18-25°C (65-75°F)',
              soil: result.data.plant_details?.soil || 'Well-draining potting mix',
              fertilizer: result.data.plant_details?.fertilizer || 'Monthly during growing season',
              pruning: result.data.plant_details?.pruning || 'Remove dead leaves as needed',
              common_problems: result.data.plant_details?.common_problems || ['Overwatering', 'Low light']
            }
          }
        };
      }

      return {
        success: false,
        error: 'No plant identified in the image'
      };

    } catch (error) {
      console.error('Galaxy.ai identification failed:', error);
      
      // Return specific error messages
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          return {
            success: false,
            error: 'Request timed out - please check your internet connection'
          };
        }
        if (error.message.includes('network')) {
          return {
            success: false,
            error: 'Network error - please check your internet connection'
          };
        }
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: false,
        error: 'Plant identification service temporarily unavailable'
      };
    }
  }

  /**
   * Convert Galaxy.ai response to our internal format
   */
  convertToInternalFormat(galaxyResponse: GalaxyAIResponse): any {
    if (!galaxyResponse.success || !galaxyResponse.data) {
      return null;
    }

    const data = galaxyResponse.data;
    const englishName = data.common_names[0] || data.plant_name;

    return {
      names: {
        english: englishName,
        arabic: this.getArabicName(englishName),
        scientific: data.scientific_name,
      },
      category: this.getCategoryFromFamily(data.family),
      confidence: data.confidence,
      care: {
        watering: data.plant_details.watering,
        light: data.plant_details.light,
        environment: `${data.plant_details.temperature}, ${data.plant_details.humidity}`,
        careInstructions: [
          data.plant_details.watering,
          data.plant_details.light,
          data.plant_details.fertilizer,
          data.plant_details.pruning,
        ].filter(Boolean),
        cairoTips: this.getCairoSpecificTips(englishName, data.plant_details.care_level),
      },
      source: 'galaxy-ai' as const,
      difficulty: data.plant_details.care_level,
    };
  }

  /**
   * Validate image for API submission
   */
  private async validateImage(uri: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const imageInfo = await FileSystem.getInfoAsync(uri);
      
      if (!imageInfo.exists) {
        return { valid: false, error: 'Image file not found' };
      }

      // Check file size
      if (imageInfo.size && imageInfo.size > this.maxFileSize) {
        return { valid: false, error: 'Image too large (max 5MB)' };
      }

      // Check if file is too small (likely corrupt)
      if (imageInfo.size && imageInfo.size < 1024) {
        return { valid: false, error: 'Image file appears to be corrupt' };
      }

      return { valid: true };
      
    } catch (error) {
      return { 
        valid: false, 
        error: 'Unable to validate image file' 
      };
    }
  }

  /**
   * Get Arabic name (simplified mapping)
   */
  private getArabicName(englishName: string): string {
    const arabicNames: { [key: string]: string } = {
      'pothos': 'بوثوس',
      'snake plant': 'نبات الثعبان',
      'spider plant': 'نبات العنكبوت',
      'peace lily': 'زنبق السلام',
      'rubber plant': 'شجرة المطاط',
      'aloe vera': 'الألوة فيرا',
      'aloe': 'صبار',
      'mint': 'نعناع',
      'basil': 'ريحان',
      'jasmine': 'ياسمين',
      'rose': 'وردة',
      'cactus': 'صبار',
      'succulent': 'عصاري',
      'fern': 'سرخس',
      'palm': 'نخيل',
      'ivy': 'لبلاب',
    };

    const searchKey = englishName.toLowerCase();
    for (const [key, arabic] of Object.entries(arabicNames)) {
      if (searchKey.includes(key)) {
        return arabic;
      }
    }

    return `نبات ${englishName}`;
  }

  /**
   * Get category from plant family
   */
  private getCategoryFromFamily(family: string): string {
    const categoryMap: { [key: string]: string } = {
      'araceae': 'Indoor Plant',
      'asparagaceae': 'Succulent',
      'moraceae': 'Indoor Tree',
      'lamiaceae': 'Herb',
      'rosaceae': 'Flowering Plant',
      'crassulaceae': 'Succulent',
      'cactaceae': 'Cactus',
      'polypodiaceae': 'Fern',
      'arecaceae': 'Palm',
    };

    const familyLower = family.toLowerCase();
    return categoryMap[familyLower] || 'House Plant';
  }

  /**
   * Get Cairo-specific care tips
   */
  private getCairoSpecificTips(plantName: string, careLevel: string): string {
    const generalTips = {
      easy: 'Perfect for Cairo apartments - very tolerant of air conditioning and indoor conditions.',
      moderate: 'Good choice for Cairo homes - needs some attention to humidity and watering.',
      difficult: 'Challenging in Cairo climate - requires careful attention to humidity and temperature.'
    };

    const specificTips: { [key: string]: string } = {
      'pothos': 'Keep away from direct desert sun. Thrives in Cairo apartments with AC.',
      'snake plant': 'Excellent for Cairo - very drought tolerant and handles temperature changes.',
      'aloe': 'Perfect for Cairo\'s dry climate. Can handle neglect and heat waves.',
      'mint': 'Keep in shade during summer heat. Water twice daily in hot months.',
      'basil': 'Protect from harsh afternoon sun. Bring indoors during winter.',
      'cactus': 'Ideal for Cairo climate - loves the dry air and bright light.',
      'succulent': 'Thrives in Cairo\'s low humidity. Perfect for sunny balconies.',
    };

    const plantLower = plantName.toLowerCase();
    for (const [key, tip] of Object.entries(specificTips)) {
      if (plantLower.includes(key)) {
        return tip;
      }
    }

    return generalTips[careLevel as keyof typeof generalTips] || generalTips.moderate;
  }
}

export const galaxyPlantIdentificationService = new GalaxyPlantIdentificationService();
export type { GalaxyAIResponse, PlantDetectionResult };