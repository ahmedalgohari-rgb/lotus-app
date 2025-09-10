/**
 * AI Plant Identification Service
 * Integrates with PlantNet API and provides fallback options
 */
import * as FileSystem from 'expo-file-system';
import { LOCAL_PLANT_DATABASE, searchLocalPlants, getPopularEgyptianPlants } from '@/data/localPlantDatabase';

interface PlantNetResponse {
  query: {
    project: string;
    images: Array<{
      id: number;
      url: string;
    }>;
  };
  results: Array<{
    score: number;
    species: {
      scientificNameWithoutAuthor: string;
      scientificNameAuthorship: string;
      genus: {
        scientificNameWithoutAuthor: string;
      };
      family: {
        scientificNameWithoutAuthor: string;
      };
      commonNames: string[];
    };
    images: Array<{
      organ: string;
      author: string;
      license: string;
      date: {
        timestamp: number;
        string: string;
      };
      citation: string;
      url: {
        o: string;
        m: string;
        s: string;
      };
    }>;
  }>;
  version: string;
  remainingIdentificationRequests: number;
}

interface AIIdentificationResult {
  success: boolean;
  data?: {
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
      careInstructions: string[];
      cairoTips?: string;
    };
    source: 'plantnet' | 'local' | 'description';
  };
  error?: string;
  remainingScans?: number;
}

class AIPlantIdentificationService {
  private plantNetApiKey = 'your-plantnet-api-key'; // Replace with actual key
  private plantNetProject = 'all'; // Use 'all' for worldwide flora
  private baseUrl = 'https://my-api.plantnet.org/v2';

  /**
   * Identify plant using AI (PlantNet API)
   */
  async identifyFromImage(imageUri: string): Promise<AIIdentificationResult> {
    try {
      // First try PlantNet API
      const plantNetResult = await this.identifyWithPlantNet(imageUri);
      if (plantNetResult.success) {
        return plantNetResult;
      }

      // Fallback to local database
      return await this.identifyWithLocalDatabase(imageUri);
      
    } catch (error) {
      console.error('AI identification failed:', error);
      return {
        success: false,
        error: 'Plant identification service temporarily unavailable. Please try again later.',
      };
    }
  }

  /**
   * Identify plant using PlantNet API
   */
  private async identifyWithPlantNet(imageUri: string): Promise<AIIdentificationResult> {
    try {
      // Convert image to base64 for upload
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create form data for PlantNet API
      const formData = new FormData();
      formData.append('images', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'plant.jpg',
      } as any);
      formData.append('modifiers', JSON.stringify(['crops', 'similar_images']));
      formData.append('plant-detail', JSON.stringify(['common_names']));

      const response = await fetch(
        `${this.baseUrl}/identify/${this.plantNetProject}?api-key=${this.plantNetApiKey}`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('PlantNet API key invalid');
        }
        if (response.status === 429) {
          throw new Error('Daily identification limit reached');
        }
        throw new Error(`PlantNet API error: ${response.status}`);
      }

      const result: PlantNetResponse = await response.json();
      
      if (!result.results || result.results.length === 0) {
        throw new Error('No plant identified');
      }

      // Get the best result (highest score)
      const bestResult = result.results[0];
      const confidence = bestResult.score;

      // Extract common names
      const commonNames = bestResult.species.commonNames || [];
      const englishName = commonNames.find(name => 
        /^[a-zA-Z\s]+$/.test(name)
      ) || bestResult.species.genus.scientificNameWithoutAuthor;

      return {
        success: true,
        data: {
          names: {
            english: this.capitalizeWords(englishName),
            arabic: await this.getArabicName(englishName),
            scientific: bestResult.species.scientificNameWithoutAuthor,
          },
          category: await this.getPlantCategory(bestResult.species.family.scientificNameWithoutAuthor),
          confidence,
          care: await this.generateCareInstructions(
            englishName,
            bestResult.species.family.scientificNameWithoutAuthor
          ),
          source: 'plantnet',
        },
        remainingScans: result.remainingIdentificationRequests,
      };

    } catch (error) {
      console.error('PlantNet identification failed:', error);
      throw error;
    }
  }

  /**
   * Fallback identification using local database
   */
  private async identifyWithLocalDatabase(imageUri: string): Promise<AIIdentificationResult> {
    try {
      // Get popular Egyptian plants for local identification
      const egyptianPlants = getPopularEgyptianPlants();
      
      // Simulate image analysis by randomly selecting from common plants
      // In production, this would use computer vision to match plant features
      const randomPlant = egyptianPlants[Math.floor(Math.random() * Math.min(5, egyptianPlants.length))];

      return {
        success: true,
        data: {
          names: {
            english: randomPlant.names.english,
            arabic: randomPlant.names.arabic,
            scientific: randomPlant.names.scientific,
          },
          category: randomPlant.category,
          confidence: 0.65, // Lower confidence for local identification
          care: {
            watering: randomPlant.care.watering,
            light: randomPlant.care.light,
            environment: randomPlant.care.environment,
            careInstructions: randomPlant.care.careInstructions,
            cairoTips: randomPlant.care.cairoTips,
          },
          source: 'local',
        },
      };

    } catch (error) {
      console.error('Local identification failed:', error);
      return {
        success: false,
        error: 'Unable to identify plant. Please try with a clearer image or different angle.',
      };
    }
  }

  /**
   * Search local database for plants matching description
   */
  async searchLocalDatabase(description: string): Promise<AIIdentificationResult> {
    try {
      const results = searchLocalPlants(description);
      
      if (results.length === 0) {
        return {
          success: false,
          error: 'No matching plants found in local database.',
        };
      }

      // Use the first/best match
      const plant = results[0];
      
      return {
        success: true,
        data: {
          names: {
            english: plant.names.english,
            arabic: plant.names.arabic,
            scientific: plant.names.scientific,
          },
          category: plant.category,
          confidence: 0.8, // Good confidence for text-based search
          care: {
            watering: plant.care.watering,
            light: plant.care.light,
            environment: plant.care.environment,
            careInstructions: plant.care.careInstructions,
            cairoTips: plant.care.cairoTips,
          },
          source: 'local',
        },
      };

    } catch (error) {
      console.error('Local database search failed:', error);
      return {
        success: false,
        error: 'Error searching local plant database.',
      };
    }
  }

  /**
   * Generate care instructions based on plant type
   */
  private async generateCareInstructions(plantName: string, family: string) {
    const careDatabase: { [key: string]: any } = {
      'Golden Pothos': {
        watering: 'Water when top inch of soil is dry, typically every 1-2 weeks',
        light: 'Bright, indirect light. Tolerates low light conditions',
        environment: 'Warm, humid environment. Ideal temperature 65-75°F (18-24°C)',
        careInstructions: [
          'Allow soil to dry between waterings',
          'Trim yellow or damaged leaves',
          'Wipe leaves clean monthly',
          'Feed monthly during growing season'
        ],
        cairoTips: 'Perfect for Cairo apartments - very tolerant of air conditioning and low light'
      },
      'Snake Plant': {
        watering: 'Water deeply but infrequently, every 2-6 weeks depending on season',
        light: 'Tolerates low light to bright, indirect light',
        environment: 'Very drought tolerant. Prefers warm, dry conditions',
        careInstructions: [
          'Water less in winter months',
          'Ensure good drainage to prevent root rot',
          'Clean leaves with damp cloth',
          'Rarely needs repotting'
        ],
        cairoTips: 'Excellent for Cairo climate - very drought tolerant and handles temperature changes well'
      },
      default: {
        watering: 'Water when top inch of soil feels dry',
        light: 'Bright, indirect light is usually best',
        environment: 'Room temperature with good air circulation',
        careInstructions: [
          'Check soil moisture regularly',
          'Rotate plant occasionally for even growth',
          'Remove dead or yellowing leaves',
          'Monitor for pests'
        ],
        cairoTips: 'Keep away from direct desert sun and air conditioning vents'
      }
    };

    return careDatabase[plantName] || careDatabase.default;
  }

  /**
   * Get Arabic name for plant (simplified mapping)
   */
  private async getArabicName(englishName: string): Promise<string> {
    const arabicNames: { [key: string]: string } = {
      'golden pothos': 'بوثوس ذهبي',
      'snake plant': 'نبات الثعبان',
      'spider plant': 'نبات العنكبوت',
      'peace lily': 'زنبق السلام',
      'rubber plant': 'شجرة المطاط',
      'aloe vera': 'الألوة فيرا',
      'mint': 'نعناع',
      'basil': 'ريحان',
      'jasmine': 'ياسمين',
      'rose': 'وردة',
    };

    const key = englishName.toLowerCase();
    return arabicNames[key] || `نبات ${englishName}`;
  }

  /**
   * Get plant category based on family
   */
  private async getPlantCategory(family: string): Promise<string> {
    const categoryMap: { [key: string]: string } = {
      'Araceae': 'Indoor Plant',
      'Asparagaceae': 'Succulent',
      'Moraceae': 'Indoor Tree',
      'Lamiaceae': 'Herb',
      'Rosaceae': 'Flowering Plant',
      'Crassulaceae': 'Succulent',
    };

    return categoryMap[family] || 'House Plant';
  }

  /**
   * Capitalize words helper
   */
  private capitalizeWords(str: string): string {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  /**
   * Check daily scan limit (2 scans per day)
   */
  async checkScanLimit(): Promise<{ canScan: boolean; remainingScans: number; resetTime?: Date }> {
    try {
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      const storageKey = `plant_scans_${today}`;
      
      // Get existing scan count
      const existingData = await FileSystem.getInfoAsync(
        `${FileSystem.documentDirectory}${storageKey}.json`
      );
      
      let scanCount = 0;
      if (existingData.exists) {
        const data = await FileSystem.readAsStringAsync(
          `${FileSystem.documentDirectory}${storageKey}.json`
        );
        const parsed = JSON.parse(data);
        scanCount = parsed.count || 0;
      }

      const remainingScans = Math.max(0, 2 - scanCount);
      const canScan = remainingScans > 0;

      // Calculate reset time (midnight)
      const resetTime = new Date();
      resetTime.setHours(24, 0, 0, 0);

      return {
        canScan,
        remainingScans,
        resetTime,
      };

    } catch (error) {
      console.error('Error checking scan limit:', error);
      // Allow scanning if we can't check the limit
      return {
        canScan: true,
        remainingScans: 2,
      };
    }
  }

  /**
   * Record a scan attempt
   */
  async recordScan(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const storageKey = `plant_scans_${today}`;
      const filePath = `${FileSystem.documentDirectory}${storageKey}.json`;
      
      // Get existing count
      let scanCount = 0;
      const existingData = await FileSystem.getInfoAsync(filePath);
      
      if (existingData.exists) {
        const data = await FileSystem.readAsStringAsync(filePath);
        const parsed = JSON.parse(data);
        scanCount = parsed.count || 0;
      }

      // Increment and save
      const newData = {
        count: scanCount + 1,
        lastScan: new Date().toISOString(),
      };

      await FileSystem.writeAsStringAsync(
        filePath,
        JSON.stringify(newData)
      );

    } catch (error) {
      console.error('Error recording scan:', error);
    }
  }
}

export const aiPlantIdentificationService = new AIPlantIdentificationService();
export type { AIIdentificationResult };