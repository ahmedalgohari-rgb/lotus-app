/**
 * Plant Research Service
 *
 * Handles automatic plant research for unknown plants
 * using the Supabase Edge Function + external APIs
 */

import { dbService } from './supabase';
import { logger } from '../utils/logger';

export interface ResearchedPlant {
  id: string;
  scientific_name: string;
  common_names: string[];
  family: string;
  genus: string;
  care_data: {
    plant_type: string;
    watering: {
      schedule: string;
      description: string;
    };
    light: {
      requirement: string;
      description: string;
    };
    temperature: {
      min: number;
      max: number;
      optimal?: number;
    };
    humidity: string;
    soil: string;
    fertilizer: string;
    plant_info: string;
    pet_safe: boolean;
  };
  research_source: string;
  confidence_score: number;
  times_requested: number;
  verified: boolean;
  created_at: string;
}

export interface ResearchResult {
  success: boolean;
  cached: boolean;
  plant?: ResearchedPlant;
  error?: string;
}

/**
 * Research an unknown plant using external APIs
 */
export async function researchPlant(
  scientificName: string,
  commonName?: string,
  family?: string
): Promise<ResearchResult> {
  try {
    logger.info(`🔍 Starting research for: ${scientificName}`);

    // Call the Edge Function
    const { data, error } = await dbService.supabase.functions.invoke('research-plant', {
      body: {
        scientificName,
        commonName,
        family
      }
    });

    if (error) {
      logger.error('Research Edge Function error:', error);
      return {
        success: false,
        cached: false,
        error: error.message
      };
    }

    if (!data.success) {
      logger.error('Research failed:', data.error);
      return {
        success: false,
        cached: false,
        error: data.error
      };
    }

    logger.info(`✅ Research complete: ${scientificName} (cached: ${data.cached}, source: ${data.plant?.research_source})`);

    return {
      success: true,
      cached: data.cached,
      plant: data.plant
    };

  } catch (error) {
    logger.error('Plant research error:', error);
    return {
      success: false,
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get researched plant from cache
 */
export async function getResearchedPlant(scientificName: string): Promise<ResearchedPlant | null> {
  try {
    const { data, error } = await dbService.supabase
      .from('researched_plants')
      .select('*')
      .eq('scientific_name', scientificName)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found - not an error
        return null;
      }
      logger.error('Cache lookup error:', error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error('Get researched plant error:', error);
    return null;
  }
}

/**
 * Get most requested unknown plants
 * (for prioritizing manual curation)
 */
export async function getMostRequestedPlants(limit: number = 20): Promise<ResearchedPlant[]> {
  try {
    const { data, error } = await dbService.supabase
      .from('researched_plants')
      .select('*')
      .eq('verified', false)
      .order('times_requested', { ascending: false })
      .order('last_requested_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch most requested plants:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Unexpected error in getMostRequestedPlants:', error);
    return [];
  }
}

/**
 * Convert researched plant to identification result format
 */
export function researchedPlantToIdentificationResult(
  researchedPlant: ResearchedPlant,
  confidence: number = 75
) {
  const care = researchedPlant.care_data;

  return {
    confidence,
    common_name: researchedPlant.common_names[0] || researchedPlant.scientific_name,
    scientific_name: researchedPlant.scientific_name,
    family: researchedPlant.family,
    genus: researchedPlant.genus,
    plant_info: care.plant_info,
    plant_type: care.plant_type,
    watering_schedule: care.watering.schedule,
    preferred_humidity: care.humidity,
    preferred_orientation: care.light.requirement,
    database_match: {
      matched: true,
      tier: 'researched', // New tier for researched plants
      confidence: researchedPlant.confidence_score,
      primary_plant_name: researchedPlant.common_names[0],
      primary_plant_info: care.plant_info,
      match_type: 'web_research',
      plant: null
    },
    alternatives: [],
    suggestions: [],
    researched: true, // Flag to indicate this came from research
    research_source: researchedPlant.research_source,
    needs_verification: !researchedPlant.verified
  };
}

/**
 * Plant Research Service
 */
export const plantResearchService = {
  research: researchPlant,
  getFromCache: getResearchedPlant,
  getMostRequested: getMostRequestedPlants,
  toIdentificationResult: researchedPlantToIdentificationResult
};
