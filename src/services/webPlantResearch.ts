/**
 * Web Plant Research Service
 *
 * @todo NOT YET IMPLEMENTED - This is a placeholder for future functionality.
 *
 * Purpose: Automatically research plant care information from the web
 * when a plant is not found in the curated database.
 *
 * Current Status: Returns failure response. All research is handled by
 * the Supabase Edge Function at `supabase/functions/research-plant/index.ts`
 * which uses the Perenual API.
 *
 * Future Implementation: May integrate direct web scraping or additional
 * plant APIs for client-side research capabilities.
 *
 * Used for: Unknown plants with no family match
 * Sources: Trusted plant care websites (Greg, PictureThis, Houseplant Alley, etc.)
 */

import { logger } from '../utils/logger';

export interface WebResearchResult {
  success: boolean;
  plantName?: string;
  scientificName?: string;
  family?: string;
  careData?: {
    plant_type: string;
    watering_schedule: string;
    preferred_humidity: string;
    preferred_orientation: string;
    plant_info: string;
    temperature?: {
      min: number;
      max: number;
      optimal?: number;
    };
    pet_safe?: boolean;
  };
  sources?: string[];
  error?: string;
}

/**
 * Research plant care information from the web
 *
 * @todo Implement actual web research functionality.
 * Currently returns a placeholder response indicating the feature is not available.
 * Use `plantResearchService` from `./plantResearch.ts` for actual research via Edge Function.
 */
export async function researchPlantOnline(
  scientificName: string,
  _commonName?: string
): Promise<WebResearchResult> {
  logger.info(`[WIP] Web research requested for: ${scientificName} - feature not yet implemented`);

  return {
    success: false,
    error: 'Web research API not yet integrated - use plantResearchService.research() instead',
    scientificName
  };
}
