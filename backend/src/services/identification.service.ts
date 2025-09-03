// backend/src/services/identification.service.ts
import { logger } from '../utils/logger';

// Free Egyptian plant database (25+ plants from PRD)
const EGYPTIAN_PLANTS = {
  'pothos': {
    scientific: 'Epipremnum aureum',
    arabic: 'البوتس',
    english: 'Pothos',
    care: {
      water: 'Every 5-7 days',
      light: 'Indirect sunlight',
      environment: 'indoor'
    }
  },
  'snake-plant': {
    scientific: 'Sansevieria trifasciata',
    arabic: 'نبات الثعبان',
    english: 'Snake Plant',
    care: {
      water: 'Every 2-3 weeks',
      light: 'Low to bright indirect light',
      environment: 'indoor'
    }
  },
  'zz-plant': {
    scientific: 'Zamioculcas zamiifolia',
    arabic: 'نبات زي زي',
    english: 'ZZ Plant',
    care: {
      water: 'Every 2-3 weeks',
      light: 'Low to bright indirect light',
      environment: 'indoor'
    }
  },
  'aloe-vera': {
    scientific: 'Aloe vera',
    arabic: 'الصبار',
    english: 'Aloe Vera',
    care: {
      water: 'Every 2-3 weeks',
      light: 'Bright, indirect light',
      environment: 'both'
    }
  },
  'jasmine': {
    scientific: 'Jasminum officinale',
    arabic: 'الياسمين',
    english: 'Jasmine',
    care: {
      water: 'Every 2-3 days',
      light: 'Full sun to partial shade',
      environment: 'outdoor'
    }
  },
  'mint': {
    scientific: 'Mentha',
    arabic: 'النعناع',
    english: 'Mint',
    care: {
      water: 'Keep soil moist',
      light: 'Partial shade',
      environment: 'both'
    }
  },
  'basil': {
    scientific: 'Ocimum basilicum',
    arabic: 'الريحان',
    english: 'Basil',
    care: {
      water: 'Keep soil moist',
      light: 'Full sun',
      environment: 'both'
    }
  },
  'rose': {
    scientific: 'Rosa',
    arabic: 'الورد',
    english: 'Rose',
    care: {
      water: 'Every 2-3 days',
      light: 'Full sun',
      environment: 'outdoor'
    }
  },
  'cactus': {
    scientific: 'Cactaceae',
    arabic: 'الصبار الشوكي',
    english: 'Cactus',
    care: {
      water: 'Every 2-4 weeks',
      light: 'Full sun',
      environment: 'both'
    }
  },
  'ficus': {
    scientific: 'Ficus benjamina',
    arabic: 'فيكس',
    english: 'Ficus',
    care: {
      water: 'Every 5-7 days',
      light: 'Bright, indirect light',
      environment: 'indoor'
    }
  },
  'rubber-plant': {
    scientific: 'Ficus elastica',
    arabic: 'نبات المطاط',
    english: 'Rubber Plant',
    care: {
      water: 'Every 5-7 days',
      light: 'Bright, indirect light',
      environment: 'indoor'
    }
  },
  'spider-plant': {
    scientific: 'Chlorophytum comosum',
    arabic: 'نبات العنكبوت',
    english: 'Spider Plant',
    care: {
      water: 'Every 5-7 days',
      light: 'Bright, indirect light',
      environment: 'indoor'
    }
  },
  'peace-lily': {
    scientific: 'Spathiphyllum',
    arabic: 'زنبقة السلام',
    english: 'Peace Lily',
    care: {
      water: 'Every 5-7 days',
      light: 'Low to medium light',
      environment: 'indoor'
    }
  },
  'monstera': {
    scientific: 'Monstera deliciosa',
    arabic: 'مونستيرا',
    english: 'Monstera',
    care: {
      water: 'Every 7-10 days',
      light: 'Bright, indirect light',
      environment: 'indoor'
    }
  },
  'fiddle-leaf-fig': {
    scientific: 'Ficus lyrata',
    arabic: 'تين الكمان',
    english: 'Fiddle Leaf Fig',
    care: {
      water: 'Every 7-10 days',
      light: 'Bright, indirect light',
      environment: 'indoor'
    }
  },
  'bougainvillea': {
    scientific: 'Bougainvillea',
    arabic: 'الجهنمية',
    english: 'Bougainvillea',
    care: {
      water: 'Every 3-4 days',
      light: 'Full sun',
      environment: 'outdoor'
    }
  },
  'hibiscus': {
    scientific: 'Hibiscus rosa-sinensis',
    arabic: 'الخطمي',
    english: 'Hibiscus',
    care: {
      water: 'Every 2-3 days',
      light: 'Full sun',
      environment: 'outdoor'
    }
  },
  'oleander': {
    scientific: 'Nerium oleander',
    arabic: 'الدفلة',
    english: 'Oleander',
    care: {
      water: 'Every 3-4 days',
      light: 'Full sun',
      environment: 'outdoor'
    }
  },
  'palm-tree': {
    scientific: 'Arecaceae',
    arabic: 'النخيل',
    english: 'Palm Tree',
    care: {
      water: 'Every 5-7 days',
      light: 'Bright light',
      environment: 'both'
    }
  },
  'lavender': {
    scientific: 'Lavandula',
    arabic: 'الخزامى',
    english: 'Lavender',
    care: {
      water: 'Every 7-10 days',
      light: 'Full sun',
      environment: 'outdoor'
    }
  },
  'geranium': {
    scientific: 'Pelargonium',
    arabic: 'الغرنوق',
    english: 'Geranium',
    care: {
      water: 'Every 3-4 days',
      light: 'Full sun to partial shade',
      environment: 'both'
    }
  },
  'marigold': {
    scientific: 'Tagetes',
    arabic: 'القطيفة',
    english: 'Marigold',
    care: {
      water: 'Every 2-3 days',
      light: 'Full sun',
      environment: 'outdoor'
    }
  },
  'petunias': {
    scientific: 'Petunia',
    arabic: 'البتونيا',
    english: 'Petunias',
    care: {
      water: 'Every 2-3 days',
      light: 'Full sun',
      environment: 'outdoor'
    }
  },
  'rosemary': {
    scientific: 'Rosmarinus officinalis',
    arabic: 'إكليل الجبل',
    english: 'Rosemary',
    care: {
      water: 'Every 7-10 days',
      light: 'Full sun',
      environment: 'both'
    }
  },
  'thyme': {
    scientific: 'Thymus vulgaris',
    arabic: 'الزعتر',
    english: 'Thyme',
    care: {
      water: 'Every 5-7 days',
      light: 'Full sun',
      environment: 'both'
    }
  }
};

export interface PlantIdentificationResult {
  success: boolean;
  data?: {
    scientific: string;
    names: {
      arabic: string;
      english: string;
    };
    confidence: number;
    care: {
      water: string;
      light: string;
      environment: string;
    };
    plantKey?: string;
  };
  error?: string;
}

export class IdentificationService {
  // Simple plant identification based on keywords
  // In Phase 2, we'll replace this with AI
  identifyPlant(description: string): PlantIdentificationResult {
    try {
      const searchTerm = description.toLowerCase().trim();
      
      logger.info(`Attempting to identify plant with description: "${description}"`);
      
      // Search through our plant database
      for (const [key, plant] of Object.entries(EGYPTIAN_PLANTS)) {
        const keyWords = key.replace('-', ' ');
        const englishName = plant.english.toLowerCase();
        const scientificName = plant.scientific.toLowerCase();
        
        if (
          searchTerm.includes(keyWords) ||
          searchTerm.includes(englishName) ||
          searchTerm.includes(plant.arabic) ||
          searchTerm.includes(scientificName) ||
          englishName.includes(searchTerm) ||
          scientificName.includes(searchTerm)
        ) {
          logger.info(`Plant identified: ${plant.english} (${plant.scientific})`);
          return {
            success: true,
            data: {
              scientific: plant.scientific,
              names: {
                arabic: plant.arabic,
                english: plant.english,
              },
              confidence: 0.85, // Mock confidence for phase 1
              care: plant.care,
              plantKey: key,
            },
          };
        }
      }

      logger.info('No exact match found, returning unknown plant');
      
      // Default response if no match found
      return {
        success: true,
        data: {
          scientific: 'Unknown species',
          names: {
            arabic: 'نبات غير محدد',
            english: 'Unknown Plant',
          },
          confidence: 0.3,
          care: {
            water: 'Every 5-7 days',
            light: 'Bright, indirect light',
            environment: 'indoor',
          },
        },
      };

    } catch (error) {
      logger.error('Failed to identify plant:', error);
      return {
        success: false,
        error: 'Failed to identify plant',
      };
    }
  }

  // Get all available plants in database
  getAvailablePlants() {
    try {
      const plants = Object.entries(EGYPTIAN_PLANTS).map(([key, plant]) => ({
        id: key,
        scientific: plant.scientific,
        names: {
          arabic: plant.arabic,
          english: plant.english,
        },
        care: plant.care,
      }));

      logger.info(`Retrieved ${plants.length} plants from database`);
      return plants;
    } catch (error) {
      logger.error('Failed to retrieve available plants:', error);
      throw new Error('Failed to retrieve available plants');
    }
  }

  // Get plant care tips by key
  getPlantCare(plantKey: string) {
    try {
      const plant = EGYPTIAN_PLANTS[plantKey as keyof typeof EGYPTIAN_PLANTS];
      if (!plant) {
        throw new Error('Plant not found in database');
      }

      logger.info(`Retrieved care tips for plant: ${plant.english}`);
      return {
        scientific: plant.scientific,
        names: {
          arabic: plant.arabic,
          english: plant.english,
        },
        care: plant.care,
      };
    } catch (error) {
      logger.error(`Failed to get care tips for plant key: ${plantKey}`, error);
      throw error;
    }
  }

  // Search plants by partial name match
  searchPlants(query: string, limit: number = 10) {
    try {
      const searchTerm = query.toLowerCase().trim();
      const results = [];

      for (const [key, plant] of Object.entries(EGYPTIAN_PLANTS)) {
        const keyWords = key.replace('-', ' ');
        const englishName = plant.english.toLowerCase();
        const scientificName = plant.scientific.toLowerCase();

        if (
          keyWords.includes(searchTerm) ||
          englishName.includes(searchTerm) ||
          plant.arabic.includes(searchTerm) ||
          scientificName.includes(searchTerm)
        ) {
          results.push({
            id: key,
            scientific: plant.scientific,
            names: {
              arabic: plant.arabic,
              english: plant.english,
            },
            care: plant.care,
          });
        }

        if (results.length >= limit) break;
      }

      logger.info(`Search for "${query}" returned ${results.length} results`);
      return results;
    } catch (error) {
      logger.error('Failed to search plants:', error);
      throw new Error('Failed to search plants');
    }
  }

  // Get plant database statistics
  getDatabaseStats() {
    try {
      const totalPlants = Object.keys(EGYPTIAN_PLANTS).length;
      const indoorPlants = Object.values(EGYPTIAN_PLANTS).filter(
        plant => plant.care.environment === 'indoor'
      ).length;
      const outdoorPlants = Object.values(EGYPTIAN_PLANTS).filter(
        plant => plant.care.environment === 'outdoor'
      ).length;
      const bothEnvironments = Object.values(EGYPTIAN_PLANTS).filter(
        plant => plant.care.environment === 'both'
      ).length;

      return {
        total: totalPlants,
        byEnvironment: {
          indoor: indoorPlants,
          outdoor: outdoorPlants,
          both: bothEnvironments,
        },
      };
    } catch (error) {
      logger.error('Failed to get database stats:', error);
      throw new Error('Failed to get database statistics');
    }
  }
}

export const identificationService = new IdentificationService();