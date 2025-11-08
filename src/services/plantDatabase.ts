/**
 * Plant Database Service - Centralized Plant Data Management
 * Provides comprehensive plant data access, search, and management capabilities
 */

import plantCareDatabase from '../data/plantCareDatabase.json';

// Enhanced interfaces for structured plant data
export interface PlantWateringInfo {
  frequency: string;
  schedule: '100_dry' | '60_dry' | '30_dry';
  description: string;
  arabic_description: string;
}

export interface PlantLightInfo {
  requirement: string;
  tolerance: string[];
  description: string;
  arabic_description: string;
}

export interface PlantCareInfo {
  plant_info: string;
  plant_info_arabic?: string;
  plant_type: 'tropical' | 'succulent' | 'flowering' | 'foliage' | 'herb' | 'fern';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  watering: PlantWateringInfo;
  light: PlantLightInfo;
  humidity: 'low' | 'medium' | 'high';
  temperature: {
    min: number;
    max: number;
    optimal: number;
  };
  soil?: string;
  fertilizer?: string;
}

export interface PlantCharacteristics {
  family: string;
  origin: string;
  mature_size: {
    height: string;
    spread: string;
  };
  growth_rate: 'very_slow' | 'slow' | 'medium' | 'fast';
  air_purifying: boolean;
  pet_safe: boolean;
  flowering: boolean;
  propagation: string;
}

export interface PlantEgyptianInfo {
  cairo_suitability: 'excellent' | 'good' | 'moderate' | 'poor';
  indoor_outdoor: 'indoor_only' | 'indoor_preferred' | 'both' | 'outdoor_preferred';
  seasonal_care: {
    summer: string;
    winter: string;
    summer_arabic: string;
    winter_arabic: string;
  };
}

export interface PlantNames {
  scientific: string[];
  common: string[];
  arabic: string[];
  aliases: string[];
}

export interface Plant {
  id: string;
  names: PlantNames;
  care: PlantCareInfo;
  characteristics: PlantCharacteristics;
  egyptian_specific: PlantEgyptianInfo;
}

export interface PlantCategory {
  name: string;
  arabic_name: string;
  description: string;
  arabic_description: string;
  plants: string[];
}

export interface PlantFamily {
  name: string;
  arabic_name: string;
  description: string;
  care: PlantCareInfo;
}

export interface PlantMatch {
  plant: Plant;
  confidence: number;
  matchType: 'exact' | 'scientific' | 'common' | 'arabic' | 'alias';
  matchedName: string;
}

class PlantDatabaseService {
  private plants: Plant[];
  private categories: Record<string, PlantCategory>;
  private families: Record<string, PlantFamily>;

  constructor() {
    this.plants = plantCareDatabase.plants as Plant[];
    this.categories = plantCareDatabase.categories as Record<string, PlantCategory>;
    this.families = plantCareDatabase.families as Record<string, PlantFamily>;
  }

  /**
   * Get all plants in the database
   */
  getAllPlants(): Plant[] {
    return this.plants;
  }

  /**
   * Get plant by ID
   */
  getPlantById(id: string): Plant | null {
    return this.plants.find(plant => plant.id === id) || null;
  }

  /**
   * Get plants by category
   */
  getPlantsByCategory(categoryId: string): Plant[] {
    const category = this.categories[categoryId];
    if (!category) return [];
    
    return category.plants
      .map(plantId => this.getPlantById(plantId))
      .filter(plant => plant !== null) as Plant[];
  }

  /**
   * Get all categories
   */
  getAllCategories(): Record<string, PlantCategory> {
    return this.categories;
  }

  /**
   * Get category by ID
   */
  getCategory(categoryId: string): PlantCategory | null {
    return this.categories[categoryId] || null;
  }

  /**
   * Get family information
   */
  getFamily(familyName: string): PlantFamily | null {
    return this.families[familyName] || this.families.default || null;
  }

  /**
   * Advanced plant search with multiple criteria
   */
  searchPlants(query: {
    text?: string;
    difficulty?: string[];
    plantType?: string[];
    lightRequirement?: string[];
    humidity?: string[];
    cairoSuitability?: string[];
    petSafe?: boolean;
    airPurifying?: boolean;
    growthRate?: string[];
  }): PlantMatch[] {
    let results = this.plants;

    // Filter by difficulty
    if (query.difficulty && query.difficulty.length > 0) {
      results = results.filter(plant => 
        query.difficulty!.includes(plant.care.difficulty)
      );
    }

    // Filter by plant type
    if (query.plantType && query.plantType.length > 0) {
      results = results.filter(plant => 
        query.plantType!.includes(plant.care.plant_type)
      );
    }

    // Filter by light requirement
    if (query.lightRequirement && query.lightRequirement.length > 0) {
      results = results.filter(plant => 
        query.lightRequirement!.includes(plant.care.light.requirement) ||
        plant.care.light.tolerance.some(light => query.lightRequirement!.includes(light))
      );
    }

    // Filter by humidity
    if (query.humidity && query.humidity.length > 0) {
      results = results.filter(plant => 
        query.humidity!.includes(plant.care.humidity)
      );
    }

    // Filter by Cairo suitability
    if (query.cairoSuitability && query.cairoSuitability.length > 0) {
      results = results.filter(plant => 
        query.cairoSuitability!.includes(plant.egyptian_specific.cairo_suitability)
      );
    }

    // Filter by pet safety
    if (query.petSafe !== undefined) {
      results = results.filter(plant => 
        plant.characteristics.pet_safe === query.petSafe
      );
    }

    // Filter by air purifying
    if (query.airPurifying !== undefined) {
      results = results.filter(plant => 
        plant.characteristics.air_purifying === query.airPurifying
      );
    }

    // Filter by growth rate
    if (query.growthRate && query.growthRate.length > 0) {
      results = results.filter(plant => 
        query.growthRate!.includes(plant.characteristics.growth_rate)
      );
    }

    // Text search (if provided)
    if (query.text && query.text.trim()) {
      const searchText = query.text.toLowerCase().trim();
      const textMatches: PlantMatch[] = [];

      for (const plant of results) {
        const match = this.findPlantTextMatch(plant, searchText);
        if (match) {
          textMatches.push(match);
        }
      }

      // Sort by confidence (highest first)
      return textMatches.sort((a, b) => b.confidence - a.confidence);
    }

    // Return all filtered results as matches with 100% confidence
    return results.map(plant => ({
      plant,
      confidence: 100,
      matchType: 'exact' as const,
      matchedName: plant.names.common[0]
    }));
  }

  /**
   * Find best text match for a plant with STRICT SUBSTRING MATCHING ONLY
   * Searches: PRIMARY common name + ALL scientific names
   * Ignores: Alternate common names, aliases, Arabic names
   * Example: "pot" → Polka Dot Begonia ✅ (primary: "Polka Dot")
   *          "sn" → Snake Plant ✅, Echeveria ❌ (ignores alternate "Mexican Snowball")
   */
  private findPlantTextMatch(plant: Plant, searchText: string): PlantMatch | null {
    const normalizedSearch = this.normalizeText(searchText);

    // Priority 1: Check PRIMARY common name only (first one, displayed on screen)
    const primaryCommonName = plant.names.common[0];
    const normalizedPrimaryName = this.normalizeText(primaryCommonName);

    if (normalizedPrimaryName.includes(normalizedSearch)) {
      const confidence = normalizedPrimaryName.startsWith(normalizedSearch) ? 100 : 90;
      return {
        plant,
        confidence,
        matchType: 'common',
        matchedName: primaryCommonName
      };
    }

    // Priority 2: Check ALL scientific names
    for (const sciName of plant.names.scientific) {
      const normalizedSciName = this.normalizeText(sciName);

      if (normalizedSciName.includes(normalizedSearch)) {
        const confidence = normalizedSciName.startsWith(normalizedSearch) ? 95 : 85;
        return {
          plant,
          confidence,
          matchType: 'scientific',
          matchedName: sciName
        };
      }
    }

    return null; // No match - ignores alternate common names, aliases, Arabic
  }

  /**
   * Normalize text for matching
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculate text similarity between two strings
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = text1.split(' ').filter(w => w.length > 2);
    const words2 = text2.split(' ').filter(w => w.length > 2);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    // Exact match bonus
    if (text1 === text2) return 100;
    
    // Word matching
    let matches = 0;
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 === word2) {
          matches++;
          break;
        }
        // Partial match for longer words
        if (word1.length > 4 && word2.length > 4) {
          const shorter = word1.length < word2.length ? word1 : word2;
          const longer = word1.length >= word2.length ? word1 : word2;
          if (longer.includes(shorter)) {
            matches += 0.8;
            break;
          }
        }
      }
    }
    
    const maxWords = Math.max(words1.length, words2.length);
    return Math.round((matches / maxWords) * 100);
  }

  /**
   * Get plant care data with language preference and fallback to family care
   */
  getComprehensivePlantCare(
    scientificName: string, 
    commonName?: string, 
    family?: string,
    language: 'en' | 'ar' = 'en'
  ): { 
    plant_name: string;
    plant_info: string; 
    watering_frequency: string;
    orientation: string;
    plant_type: string;
    matchInfo?: PlantMatch
  } {
    // Try to find exact plant match
    const searchResults = this.searchPlants({
      text: `${scientificName} ${commonName || ''}`.trim()
    });

    if (searchResults.length > 0 && searchResults[0].confidence >= 60) {
      const bestMatch = searchResults[0];
      return this.formatPlantCareResponse(bestMatch.plant, language, bestMatch);
    }

    // Fallback to family-based care
    const familyInfo = this.getFamily(family || '');
    
    if (familyInfo) {
      return {
        plant_name: commonName || scientificName,
        plant_info: familyInfo.care.plant_info + (family ? ` (Family: ${family})` : ''),
        watering_frequency: this.formatWateringFrequency(familyInfo.care.watering.schedule, language),
        orientation: this.formatOrientation(familyInfo.care.light.requirement, language),
        plant_type: familyInfo.care.plant_type
      };
    }
    
    // Ultimate fallback
    const defaultFamily = this.getFamily('default')!;
    return {
      plant_name: commonName || scientificName,
      plant_info: commonName 
        ? `${commonName} - ${defaultFamily.care.plant_info}`
        : defaultFamily.care.plant_info,
      watering_frequency: this.formatWateringFrequency(defaultFamily.care.watering.schedule, language),
      orientation: this.formatOrientation(defaultFamily.care.light.requirement, language),
      plant_type: defaultFamily.care.plant_type
    };
  }

  /**
   * Format plant care response based on language preference
   */
  private formatPlantCareResponse(
    plant: Plant, 
    language: 'en' | 'ar', 
    matchInfo?: PlantMatch
  ): {
    plant_name: string;
    plant_info: string;
    watering_frequency: string;
    orientation: string;
    plant_type: string;
    matchInfo?: PlantMatch;
  } {
    return {
      plant_name: language === 'ar' 
        ? plant.names.arabic[0] || plant.names.common[0]
        : plant.names.common[0],
      plant_info: plant.care.plant_info,
      watering_frequency: this.formatWateringFrequency(plant.care.watering.schedule, language),
      orientation: this.formatOrientation(plant.care.light.requirement, language),
      plant_type: plant.care.plant_type,
      matchInfo
    };
  }

  /**
   * Format watering frequency based on language
   */
  private formatWateringFrequency(schedule: '100_dry' | '60_dry' | '30_dry', language: 'en' | 'ar'): string {
    const schedules = {
      en: {
        '100_dry': '100% Dry - Water when completely dry',
        '60_dry': '60% Dry - Water when mostly dry',
        '30_dry': '30% Dry - Water when slightly dry'
      },
      ar: {
        '100_dry': 'جفاف 100% - اسقِ عندما تجف التربة تماماً',
        '60_dry': 'جفاف 60% - اسقِ عندما تجف التربة إلى حد كبير',
        '30_dry': 'جفاف 30% - اسقِ عندما تجف التربة قليلاً'
      }
    };
    
    return schedules[language][schedule];
  }

  /**
   * Format orientation/light requirement based on language
   */
  private formatOrientation(requirement: string, language: 'en' | 'ar'): string {
    const orientations = {
      en: {
        'bright_direct': 'Indoor/Outdoor - South Window (Direct Sun)',
        'bright_indirect': 'Indoor - East/West Window (Bright Indirect)',
        'medium_light': 'Indoor - East Window (Medium Light)',
        'low_light': 'Indoor - North Window (Low Light)',
        'north': 'Indoor - North Window',
        'east': 'Indoor - East Window',
        'south': 'Indoor - South Window',
        'west': 'Indoor - West Window'
      },
      ar: {
        'bright_direct': 'داخلي/خارجي - نافذة جنوبية (شمس مباشرة)',
        'bright_indirect': 'داخلي - نافذة شرقية/غربية (ضوء ساطع غير مباشر)',
        'medium_light': 'داخلي - نافذة شرقية (ضوء متوسط)',
        'low_light': 'داخلي - نافذة شمالية (ضوء منخفض)',
        'north': 'داخلي - نافذة شمالية',
        'east': 'داخلي - نافذة شرقية',
        'south': 'داخلي - نافذة جنوبية',
        'west': 'داخلي - نافذة غربية'
      }
    };
    
    const langOrientations = orientations[language] as Record<string, string>;
    return langOrientations[requirement] || langOrientations['bright_indirect'];
  }

  /**
   * Get plants suitable for specific conditions
   */
  getPlantRecommendations(conditions: {
    lightLevel?: 'low' | 'medium' | 'bright';
    experience?: 'beginner' | 'intermediate' | 'advanced';
    petSafe?: boolean;
    airPurifying?: boolean;
    cairoClimate?: boolean;
  }): Plant[] {
    let query: any = {};
    
    if (conditions.experience) {
      query.difficulty = [conditions.experience];
    }
    
    if (conditions.lightLevel) {
      const lightMap = {
        low: ['low_light', 'north'],
        medium: ['bright_indirect', 'east', 'west'],
        bright: ['bright_direct', 'south', 'bright_indirect']
      };
      query.lightRequirement = lightMap[conditions.lightLevel];
    }
    
    if (conditions.petSafe !== undefined) {
      query.petSafe = conditions.petSafe;
    }
    
    if (conditions.airPurifying !== undefined) {
      query.airPurifying = conditions.airPurifying;
    }
    
    if (conditions.cairoClimate) {
      query.cairoSuitability = ['excellent', 'good'];
    }
    
    return this.searchPlants(query).map(match => match.plant);
  }

  /**
   * Development utility: Get database stats
   */
  getDatabaseStats() {
    return {
      totalPlants: this.plants.length,
      totalCategories: Object.keys(this.categories).length,
      totalFamilies: Object.keys(this.families).length,
      plantsByDifficulty: {
        beginner: this.plants.filter(p => p.care.difficulty === 'beginner').length,
        intermediate: this.plants.filter(p => p.care.difficulty === 'intermediate').length,
        advanced: this.plants.filter(p => p.care.difficulty === 'advanced').length
      },
      plantsByCairoSuitability: {
        excellent: this.plants.filter(p => p.egyptian_specific.cairo_suitability === 'excellent').length,
        good: this.plants.filter(p => p.egyptian_specific.cairo_suitability === 'good').length,
        moderate: this.plants.filter(p => p.egyptian_specific.cairo_suitability === 'moderate').length
      }
    };
  }
}

// Export singleton instance
export const plantDatabaseService = new PlantDatabaseService();
export default plantDatabaseService;