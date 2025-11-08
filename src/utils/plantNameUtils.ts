/**
 * Plant Name Normalization and Matching Utilities
 * Provides robust plant identification and care data lookup
 * UPDATED: Now uses centralized PlantDatabaseService
 */

import { plantDatabaseService } from '../services/plantDatabase';

export interface SimplifiedPlantCare {
  plant_name: string;
  plant_info: string;
  watering_frequency: string;
  orientation: string;
}

export interface PlantMatch {
  id: string;
  confidence: number;
  matchType: 'scientific' | 'common' | 'alias';
  matchedName: string;
}

/**
 * Normalize plant name for matching
 * - Convert to lowercase
 * - Remove special characters and extra spaces
 * - Remove author citations from scientific names
 */
export function normalizePlantName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace special chars with spaces
    .replace(/\b\([^)]*\)/g, '') // Remove parenthetical author citations
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

/**
 * Extract individual words for fuzzy matching
 */
export function extractKeyWords(name: string): string[] {
  const normalized = normalizePlantName(name);
  return normalized.split(' ').filter(word => word.length > 2); // Ignore short words
}

/**
 * Calculate similarity between two normalized names
 * Returns a score from 0-100
 */
export function calculateSimilarity(name1: string, name2: string): number {
  const words1 = extractKeyWords(name1);
  const words2 = extractKeyWords(name2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  // Exact match bonus
  if (normalizePlantName(name1) === normalizePlantName(name2)) return 100;
  
  // Word-based matching
  let matches = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2) {
        matches++;
        break;
      }
      // Partial word match (for things like "trifasciata" vs "trifasciat")
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
 * Find the best matching plant from the database using centralized service
 * Returns the plant with the highest confidence score
 */
export function findPlantMatch(scientificName: string, commonName?: string): PlantMatch | null {
  const searchResults = plantDatabaseService.searchPlants({
    text: `${scientificName} ${commonName || ''}`.trim()
  });
  
  if (searchResults.length > 0 && searchResults[0].confidence >= 60) {
    const result = searchResults[0];
    return {
      id: result.plant.id,
      confidence: result.confidence,
      matchType: result.matchType as 'scientific' | 'common' | 'alias',
      matchedName: result.matchedName
    };
  }
  
  return null;
}

/**
 * Get plant care data by plant ID (DEPRECATED - use plantDatabaseService directly)
 */
export function getPlantCareData(plantId: string): SimplifiedPlantCare | null {
  const plant = plantDatabaseService.getPlantById(plantId);
  if (!plant) return null;
  
  return {
    plant_name: plant.names.common[0],
    plant_info: plant.care.plant_info,
    watering_frequency: plantDatabaseService['formatWateringFrequency'](plant.care.watering.schedule, 'en'),
    orientation: plantDatabaseService['formatOrientation'](plant.care.light.requirement, 'en')
  };
}

/**
 * Main function: Get comprehensive plant care data with language support
 * This is the main entry point that uses the centralized database service
 */
export function getComprehensivePlantCare(
  scientificName: string, 
  commonName?: string, 
  family?: string,
  language: 'en' | 'ar' = 'en'
): SimplifiedPlantCare & { matchInfo?: any } {
  return plantDatabaseService.getComprehensivePlantCare(
    scientificName, 
    commonName, 
    family, 
    language
  );
}

/**
 * Development/Testing utility: Test plant name matching (logging removed)
 */
export function debugPlantMatching(scientificName: string, commonName?: string) {
  const match = findPlantMatch(scientificName, commonName);
  return match;
}