import { IdentificationResult } from '../types';
import { plantDatabaseService } from './plantDatabase';
import { authService } from './supabase';
import { plantNetCache } from '../utils/apiCache';
import {
  enhanceImageForPlantIdentification,
  assessImageQualityForPlants,
  resizeImageForPlantNet
} from '../utils/imageUtils';
import { logger } from '../utils/logger';
import * as FileSystem from 'expo-file-system';
import CryptoJS from 'crypto-js';

// 🔒 SECURITY: PlantNet API calls now go through secure Edge Function
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1`;

export interface PlantNetResponse {
  results: Array<{
    species: {
      scientificNameWithoutAuthor: string;
      scientificNameAuthorship: string;
      genus: {
        scientificNameWithoutAuthor: string;
      };
      family: {
        scientificNameWithoutAuthor: string;
      };
      commonNames?: string[];
    };
    score: number;
  }>;
  species?: Array<{  // Legacy format fallback
    scientificNameWithoutAuthor: string;
    scientificNameAuthorship: string;
    genus: {
      scientificNameWithoutAuthor: string;
    };
    family: {
      scientificNameWithoutAuthor: string;
    };
    commonNames: Array<{
      lang: string;
      name: string;
    }>;
    score: number;
  }>;
  query: {
    project: string;
    images: Array<{
      organ: string;
    }>;
  };
  language: string;
  preferedReferential: string;
  switchToProject?: string;
  remainingIdentificationRequests: number;
}

/**
 * Generate a unique cache key based on image content and parameters
 */
async function generateImageCacheKey(
  imageUri: string,
  organ: string,
  language: string
): Promise<string> {
  try {
    // Get image file info for a unique identifier
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    const imageSize = (fileInfo.exists && 'size' in fileInfo) ? fileInfo.size : 0;
    const modificationTime = (fileInfo.exists && 'modificationTime' in fileInfo) ? fileInfo.modificationTime : 0;

    // Create a hash based on image characteristics and parameters
    const keyData = `${imageUri}_${imageSize}_${modificationTime}_${organ}_${language}`;
    return CryptoJS.SHA1(keyData).toString();
  } catch (error) {
    // Fallback to simple hash if file info fails
    const keyData = `${imageUri}_${organ}_${language}_${Date.now()}`;
    return CryptoJS.SHA1(keyData).toString();
  }
}

/**
 * Cached PlantNet API call - avoids re-identifying the same image
 */
async function cachedPlantNetApiCall(
  imageUri: string,
  organ: string,
  language: 'en' | 'ar'
): Promise<PlantNetResponse | null> {
  const cacheKey = await generateImageCacheKey(imageUri, organ, language);
  
  return plantNetCache.getOrSet(
    cacheKey,
    () => directPlantNetApiCall(imageUri, organ, language),
    30 * 60 * 1000 // 30 minutes cache
  );
}

/**
 * 🔒 SECURE: Call PlantNet via Edge Function (API key protected server-side)
 */
async function directPlantNetApiCall(
  imageUri: string,
  organ: string,
  language: 'en' | 'ar'
): Promise<PlantNetResponse | null> {
  // Get user session for authentication
  const { session, error: sessionError } = await authService.getSession();

  if (sessionError || !session) {
    logger.error('❌ User not authenticated - cannot call PlantNet API');
    throw new Error(
      'You must be logged in to identify plants. Please sign in and try again.'
    );
  }

  // ⚡ PERFORMANCE: Resize to 500px (PlantNet optimal size)
  // 500px = 50-100KB JPEG vs 1000px = 200-400KB → 75% faster upload!
  logger.debug('🔍 Resizing image for Edge Function...');
  const resizedImageUri = await resizeImageForPlantNet(imageUri, 500);

  // Convert RESIZED image to base64 for Edge Function
  logger.debug('🔍 Converting resized image to base64...');
  const imageBase64 = await FileSystem.readAsStringAsync(resizedImageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const base64WithPrefix = `data:image/jpeg;base64,${imageBase64}`;

  // Add 30-second timeout for slow networks
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  logger.debug(`📤 Calling Edge Function: identify-plant (organ=${organ}, lang=${language})`);

  // 🧪 DEV MODE: Disable rate limiting for Expo development builds
  const isDevMode = __DEV__; // true only in Expo dev, false in TestFlight/production
  if (isDevMode) {
    logger.info('🧪 DEV MODE: Unlimited scanning enabled for testing');
  }

  const response = await fetch(`${EDGE_FUNCTION_URL}/identify-plant`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`, // ✅ Send USER token, not anon key
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      ...(isDevMode && { 'X-Dev-Mode': 'true' }), // 🧪 Bypass rate limits in dev
    },
    body: JSON.stringify({
      imageBase64: base64WithPrefix,
      organ,
      language,
    }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    logger.error(`❌ Edge Function error: ${response.status}`, errorData);
    throw new Error(
      errorData.message || `PlantNet service error: ${response.status} ${response.statusText}`
    );
  }

  const plantNetData = await response.json();
  logger.debug(`✅ Edge Function response received: ${plantNetData.results?.length || 0} results`);

  return plantNetData;
}

// 🌿 DEFAULT CULTIVARS: Auto-select most common variety for species with multiple cultivars
// This prevents overwhelming beginners with choices when care is nearly identical
const DEFAULT_CULTIVARS: Record<string, string> = {
  'Dracaena trifasciata': 'snake_plant_laurentii',           // Classic Snake Plant
  'Syngonium podophyllum': 'arrowhead_vine',                 // Basic Arrowhead Vine
  'Anthurium andraeanum': 'red_anthurium',                   // Red is most popular
  'Fittonia albivenis': 'fittonia',                          // Generic Nerve Plant
  'Opuntia microdasys': 'bunny_ear_cactus',                  // Classic yellow variety
  'Gymnocalycium mihanovichii': 'moon_cactus',               // More popular than ball
  'Euphorbia pulcherrima': 'christmas_poinsettia',           // Red is classic
  'Dracaena reflexa': 'song_of_india',                       // More common than Jamaica
  'Peperomia obtusifolia': 'peperomia_obtusifolia',          // Plain green is common
};

// 🌿 GENERIC SPECIES NAMES: Show simple names instead of cultivar names for better UX
// "Snake Plant" is friendlier than "Snake Plant Laurentii" for beginners
const GENERIC_SPECIES_NAMES: Record<string, string> = {
  'Dracaena trifasciata': 'Snake Plant',
  'Syngonium podophyllum': 'Arrowhead Vine',
  'Anthurium andraeanum': 'Flamingo Flower',
  'Fittonia albivenis': 'Nerve Plant',
  'Opuntia microdasys': 'Bunny Ear Cactus',
  'Gymnocalycium mihanovichii': 'Moon Cactus',
  'Euphorbia pulcherrima': 'Poinsettia',
  'Dracaena reflexa': 'Song of India',
  'Peperomia obtusifolia': 'Baby Rubber Plant',
};

export const plantNetService = {
  /**
   * Enhanced plant identification with caching and multiple attempts
   * Updated to use centralized PlantDatabaseService and smart caching
   */
  identifyPlant: async (
    imageUri: string,
    organ: string = 'leaf',
    language: 'en' | 'ar' = 'en'
  ): Promise<IdentificationResult | null> => {
    try {
      // Phase 1: Image Quality Assessment and Validation
      const qualityAssessment = await assessImageQualityForPlants(imageUri);

      // Phase 2: Image Enhancement for Better Identification
      const enhancedImageUri = await enhanceImageForPlantIdentification(imageUri, {
        autoEnhance: true,
        enhanceContrast: qualityAssessment.contrast < 0.6,
        adjustBrightness: qualityAssessment.brightness < 0.4 || qualityAssessment.brightness > 0.8,
        sharpen: qualityAssessment.sharpness < 0.7
      });

      // Phase 3: Enhanced Plant Identification with Multiple Organ Types
      const organs = [organ, 'leaf', 'flower', 'fruit'];
      let bestResult: IdentificationResult | null = null;
      let highestConfidence = 0;

      // Try enhanced image first, then original if enhancement fails
      const imagesToTry = enhancedImageUri !== imageUri ? [enhancedImageUri, imageUri] : [imageUri];

      for (const imageToProcess of imagesToTry) {
        for (const currentOrgan of organs) {
          try {
            const result = await plantNetService.identifyWithOrgan(imageToProcess, currentOrgan, language);

            if (result && result.confidence > highestConfidence) {
              bestResult = result;
              highestConfidence = result.confidence;

              // Add quality assessment feedback to result
              if (bestResult) {
                bestResult.plant_info += ` ${language === 'ar' ? 'تم تحسين جودة الصورة لتحديد أفضل.' : 'Image quality optimized for better identification.'}`;
              }
            }

            // ⚡ PERFORMANCE: Stop immediately if we get a good result
            // 1. High PlantNet confidence (>80%), OR
            // 2. TIER 1 exact database match (no need to try more organs!)
            if (result) {
              const hasHighConfidence = result.confidence > 80;
              const hasTier1Match = result.database_match?.match_type === 'exact';

              if (hasHighConfidence || hasTier1Match) {
                logger.debug(`⚡ Stopping organ search: ${hasHighConfidence ? 'High confidence' : 'TIER 1 exact match'}`);
                break; // Stop trying other organs
              }
            }
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));

            // Diagnostic Logging - API Failure
            logger.error('PlantNet API Failed:', {
              organ: currentOrgan,
              errorMessage: error.message,
              errorType: error.name
            });

            // Don't retry on authentication errors - they will always fail
            if (error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('logged in')) {
              logger.error('Authentication Error - cannot retry');
              throw error;
            }

            // Don't retry on 404 "Species not found" - PlantNet's way of saying "not a plant"
            if (error.message.includes('404') || error.message.includes('Not Found') || error.message.includes('Species not found')) {
              logger.warn('PlantNet could not identify this image (404)');
              return null;
            }

            // If API is blocked (IP restriction), throw error
            if (error.message.includes('access denied') || error.message.includes('403')) {
              logger.error('PlantNet API Access Denied (403 Forbidden)');
              throw new Error(
                'The plant identification service is currently unavailable. Please try again in a few moments. (Code: API_ACCESS_DENIED)'
              );
            }

            // Continue to next organ only for transient errors (network, timeout, etc.)
            continue;
          }
        }
        
        // If we got a good result with enhanced image, don't try original
        if (bestResult && bestResult.confidence > 70) {
          break;
        }
      }

      // Phase 4: Post-Processing and Recommendations
      if (bestResult && bestResult.confidence < 70) {
        bestResult.suggestions = plantNetService.getCommonEgyptianPlants(language);

        // NOTE: Color detection removed - was incorrectly appending temporary image
        // analysis ("Dominant color: purple") to permanent plant database stories
      }

      // Final Result
      if (!bestResult) {
        logger.warn('⚠️  PlantNet returned results but none matched confidence threshold');
        return null; // Return null, let UI handle showing "No Results" error
      }

      return bestResult;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Plant Identification Failed:', {
        errorMessage: error.message,
        errorType: error.name,
        errorStack: error.stack?.substring(0, 200)
      });
      throw new Error(`Failed to identify plant: ${error.message}`);
    }
  },


  /**
   * Identify plant with specific organ type
   */
  identifyWithOrgan: async (
    imageUri: string, 
    organ: string,
    language: 'en' | 'ar' = 'en'
  ): Promise<IdentificationResult | null> => {
    // Use cached API call for better performance
    const data = await cachedPlantNetApiCall(imageUri, organ, language);

    if (!data) {
      logger.warn('PlantNet API returned no data');
      return null;
    }
    
    // Handle both new format (results) and legacy format (species)
    let speciesResults;
    if (data.results && data.results.length > 0) {
      // New format: results array
      speciesResults = data.results.map(result => ({
        scientificNameWithoutAuthor: result.species.scientificNameWithoutAuthor,
        scientificNameAuthorship: result.species.scientificNameAuthorship,
        genus: result.species.genus,
        family: result.species.family,
        commonNames: result.species.commonNames?.map(name => ({ lang: 'en', name })) || [],
        score: result.score
      }));
    } else if (data.species && data.species.length > 0) {
      // Legacy format: species array
      speciesResults = data.species;
    } else {
      return null;
    }

    // ⚡ PERFORMANCE: Reject very low confidence immediately (< 15%)
    // Industry standard: 15-20% minimum for valid plant identification
    // Lower threshold = better user experience, catches more valid plants
    const topScore = speciesResults[0]?.score || 0;
    if (topScore < 0.15) {
      logger.warn(`⚠️  Very low confidence (${Math.round(topScore * 100)}%) - likely not a plant or extremely poor photo`);
      logger.warn('   Rejecting immediately (below 15% threshold)');
      return null; // User will see "No Results" with suggestion to retake photo
    }

    // Log confidence level for monitoring
    if (topScore < 0.30) {
      logger.info(`✅ Accepting result with ${Math.round(topScore * 100)}% confidence (above 15% threshold)`);
    }

    return await plantNetService.processBestMatch(speciesResults, language);
  },

  /**
   * Match PlantNet result to database plant for tier classification
   * This determines whether the plant is Tier 1 (exact), Tier 2 (genus), or Tier 3 (none)
   *
   * TIER 1: Exact scientific name match (no substring/partial matching)
   * TIER 2: Same genus (e.g., species vs cultivar, or different species in same genus)
   * TIER 3: Common name match only
   *
   * NEW: When multiple cultivars match the same species (e.g., "Song of India" and "Song of Jamaica"
   * both being Dracaena reflexa), we return `multiple_cultivars: true` with ALL options in
   * `all_cultivars` array so the UI can show a picker.
   */
  matchPlantToDatabase: (
    scientificName: string,
    genus: string,
    commonName: string,
    family: string,
    confidence: number
  ): {
    found: boolean;
    confidence: number;
    plant_id: string | null;
    match_type: 'exact' | 'genus' | 'common_name' | 'none';
    primary_plant_name?: string; // Name from database to display instead of PlantNet
    primary_plant_info?: string; // Plant info from database
    // NEW: For cultivar picker feature
    multiple_cultivars?: boolean; // True when >1 exact matches exist
    all_cultivars?: Array<{
      plant_id: string;
      plant_name: string;
      scientific_name: string;
    }>;
    alternatives?: Array<{
      plant_id: string;
      confidence: number;
      plant_name: string;
    }>;
  } => {
    // Normalize for comparison (remove special chars, lowercase, trim)
    const normalizeScientificName = (name: string) => {
      return name
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const normalizedSearchName = normalizeScientificName(scientificName);

    // ✅ TIER 1: Common name match FIRST (highest priority - what user actually sees)
    // If PlantNet says "Eyelash begonia" and we have it → USE IT, don't check scientific name
    const commonNameMatch = plantDatabaseService.searchPlants({
      text: commonName
    });

    const commonMatches = commonNameMatch.filter(m =>
      m.matchType === 'common' && m.confidence >= 60
    );

    if (commonMatches.length > 0) {
      logger.debug(`✅ TIER 1: Common name match - ${commonMatches[0].plant.id} (EXACT MATCH FOUND)`);
      logger.debug(`   PlantNet common: "${commonName}" ~ Database: "${commonMatches[0].matchedName}"`);

      return {
        found: true,
        confidence: 95, // High confidence - exact common name match
        plant_id: commonMatches[0].plant.id,
        match_type: 'exact', // Changed from 'common_name' to 'exact' - this IS an exact match!
        primary_plant_name: commonMatches[0].plant.names.common[0],
        primary_scientific_name: commonMatches[0].plant.names.scientific[0], // ✅ Database scientific name
        primary_plant_info: commonMatches[0].plant.care?.plant_info,
        // 🌐 Arabic content from database
        primary_plant_name_arabic: commonMatches[0].plant.names.arabic?.[0],
        primary_plant_info_arabic: commonMatches[0].plant.care?.plant_info_arabic,
        // Show alternatives if multiple common name matches
        alternatives: commonMatches.slice(1, 7).map(m => ({
          plant_id: m.plant.id,
          confidence: 95,
          plant_name: m.plant.names.common[0]
        }))
      };
    }

    // ⚠️ Common name NOT in database - fall back to scientific/genus matching
    logger.debug(`⚠️ Common name "${commonName}" not found in database - trying scientific/genus match...`);

    // TIER 2: EXACT scientific name match (fallback only if common name not found)
    const allPlants = plantDatabaseService.getAllPlants();
    const exactMatches: Array<{ plant: any; matchedName: string }> = [];

    for (const plant of allPlants) {
      for (const sciName of plant.names.scientific) {
        const normalizedDbName = normalizeScientificName(sciName);

        // Exact match only - no substring!
        if (normalizedDbName === normalizedSearchName) {
          exactMatches.push({ plant, matchedName: sciName });
          break; // Found exact match for this plant
        }
      }
    }

    if (exactMatches.length > 0) {
      const hasMultipleCultivars = exactMatches.length > 1;

      // 🌿 AUTO-SELECT: For species with multiple cultivars, pick the most common/default one
      let selectedPlant = exactMatches[0]; // Fallback to first
      let selectedIndex = 0;

      if (hasMultipleCultivars) {
        // Check if we have a predefined default for this species
        const normalizedScientificName = normalizeScientificName(scientificName);
        const defaultCultivarId = DEFAULT_CULTIVARS[scientificName] || DEFAULT_CULTIVARS[normalizedScientificName];

        if (defaultCultivarId) {
          const defaultMatch = exactMatches.find(m => m.plant.id === defaultCultivarId);
          if (defaultMatch) {
            selectedPlant = defaultMatch;
            selectedIndex = exactMatches.indexOf(defaultMatch);
            logger.debug(`🌿 AUTO-SELECTED default cultivar: ${defaultCultivarId}`);
          }
        }

        logger.debug(`✅ TIER 2: Exact scientific name match (fallback) - MULTIPLE CULTIVARS (${exactMatches.length})`);
        logger.debug(`   PlantNet: "${scientificName}" matches ${exactMatches.length} cultivars:`);
        exactMatches.forEach(m => logger.debug(`     - ${m.plant.id}: ${m.plant.names.common[0]}`));
      } else {
        logger.debug(`✅ TIER 2: Exact scientific name match (fallback) - ${exactMatches[0].plant.id}`);
        logger.debug(`   PlantNet: "${scientificName}" = Database: "${exactMatches[0].matchedName}"`);
      }

      // Use generic species name for better UX (e.g., "Snake Plant" instead of "Snake Plant Laurentii")
      const genericName = GENERIC_SPECIES_NAMES[scientificName] || GENERIC_SPECIES_NAMES[normalizeScientificName(scientificName)];

      return {
        found: true,
        confidence: 95, // High confidence for exact match
        plant_id: selectedPlant.plant.id,
        match_type: 'exact',
        primary_plant_name: genericName || selectedPlant.plant.names.common[0],
        primary_scientific_name: selectedPlant.matchedName, // ✅ Database scientific name
        primary_plant_info: selectedPlant.plant.care?.plant_info,
        // 🌐 Arabic content from database
        primary_plant_name_arabic: selectedPlant.plant.names.arabic?.[0],
        primary_plant_info_arabic: selectedPlant.plant.care?.plant_info_arabic,
        // NEW: Include all cultivars for optional refiner when multiple exist
        multiple_cultivars: hasMultipleCultivars,
        all_cultivars: hasMultipleCultivars
          ? exactMatches.map(m => ({
              plant_id: m.plant.id,
              plant_name: m.plant.names.common[0],
              scientific_name: m.matchedName,
              is_selected: m.plant.id === selectedPlant.plant.id, // Mark the auto-selected one
            }))
          : undefined,
        // 🔧 FIX: Show up to 6 alternatives for exact matches too
        alternatives: exactMatches.slice(1, 7).map(m => ({
          plant_id: m.plant.id,
          confidence: 95,
          plant_name: m.plant.names.common[0]
        }))
      };
    }

    // TIER 3: Genus match (same genus, different species/cultivar)
    // "Dracaena trifasciata" → "Dracaena trifasciata 'Golden Flame'" = Tier 3 (genus match)
    // "Dracaena trifasciata" → "Dracaena zeylanica" = Tier 3 (genus match)
    const genusMatches: Array<{ plant: any; matchedName: string }> = [];

    for (const plant of allPlants) {
      for (const sciName of plant.names.scientific) {
        const normalizedDbName = normalizeScientificName(sciName);

        // Extract genus (first word) from database name
        const dbGenus = normalizedDbName.split(' ')[0];
        const searchGenus = normalizedSearchName.split(' ')[0];

        // Same genus match
        if (dbGenus === searchGenus && normalizedDbName !== normalizedSearchName) {
          genusMatches.push({ plant, matchedName: sciName });
          break; // Found genus match for this plant
        }
      }
    }

    if (genusMatches.length > 0) {
      logger.debug(`✅ TIER 3: Genus match (fallback) - found ${genusMatches.length} similar plants`);
      logger.debug(`   PlantNet identified: "${commonName}" (${scientificName})`);
      logger.debug(`   Not in database - showing top 3 similar ${genus} plants`);

      // Sort by difficulty (beginner first) to show most commonly used varieties
      const sortedMatches = genusMatches.sort((a, b) => {
        const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
        const diffA = difficultyOrder[a.plant.care?.difficulty] || 3;
        const diffB = difficultyOrder[b.plant.care?.difficulty] || 3;
        return diffA - diffB;
      });

      return {
        found: true,
        confidence: confidence, // Keep PlantNet's original confidence
        plant_id: null, // ⚠️ This exact plant is NOT in database
        match_type: 'genus',
        // ✅ Show what PlantNet identified (NOT database plant)
        primary_plant_name: commonName,
        primary_scientific_name: scientificName,
        primary_plant_info: `We don't have "${commonName}" in our database yet. Here are similar ${genus} plants you can save:`,
        // 🌐 Arabic content
        primary_plant_name_arabic: commonName, // Keep original (no translation available)
        primary_plant_info_arabic: `ليس لدينا "${commonName}" في قاعدة البيانات حتى الآن. إليك نباتات ${genus} مماثلة يمكنك حفظها:`,
        // ✅ Show TOP 3 most common alternatives (beginner-friendly first)
        alternatives: sortedMatches.slice(0, 3).map(m => ({
          plant_id: m.plant.id,
          confidence: 80,
          plant_name: m.plant.names.common[0],
          difficulty: m.plant.care?.difficulty || 'intermediate' // Show difficulty level
        }))
      };
    }

    // No match found after trying all tiers - return none
    logger.debug(`❌ No database match found`);
    logger.debug(`   Tried TIER 1: Common name "${commonName}" - NOT FOUND`);
    logger.debug(`   Tried TIER 2: Scientific name "${scientificName}" - NOT FOUND`);
    logger.debug(`   Tried TIER 3: Genus "${genus}" - NOT FOUND`);

    return {
      found: false,
      confidence: confidence,
      plant_id: null,
      match_type: 'none'
    };
  },

  /**
   * Process multiple results to find the best match with language support
   */
  processBestMatch: async (species: any[], language: 'en' | 'ar' = 'en'): Promise<IdentificationResult> => {
    const topResult = species[0];

    // Get common name in English or Arabic
    const commonNameEn = topResult.commonNames?.find((name: any) => name.lang === 'en')?.name;
    const commonNameAr = topResult.commonNames?.find((name: any) => name.lang === 'ar')?.name;
    const commonName = commonNameEn || commonNameAr || topResult.scientificNameWithoutAuthor;

    // 🔍 DEBUG: Log what PlantNet gave us (helps understand cultivar detection)
    logger.debug('🌿 PlantNet returned:', {
      scientificName: topResult.scientificNameWithoutAuthor,
      commonNameEn,
      commonNameAr,
      allCommonNames: topResult.commonNames,
      score: topResult.score
    });

    // Calculate adjusted confidence based on multiple factors
    let adjustedConfidence = Math.round(topResult.score * 100);
    
    // Boost confidence if we have multiple similar results
    if (species.length > 1) {
      const similarResults = species.filter(s => 
        s.genus.scientificNameWithoutAuthor === topResult.genus.scientificNameWithoutAuthor
      );
      if (similarResults.length > 1) {
        adjustedConfidence = Math.min(95, adjustedConfidence + 10);
      }
    }

    // Boost confidence for common houseplants
    const commonHouseplants = ['pothos', 'monstera', 'sansevieria', 'ficus', 'philodendron'];
    if (commonHouseplants.some(plant => 
      commonName.toLowerCase().includes(plant) || 
      topResult.scientificNameWithoutAuthor.toLowerCase().includes(plant)
    )) {
      adjustedConfidence = Math.min(95, adjustedConfidence + 5);
    }

    // Get comprehensive care data using centralized service (now async)
    const careData = await plantDatabaseService.getComprehensivePlantCare(
      topResult.scientificNameWithoutAuthor,
      commonName,
      topResult.family.scientificNameWithoutAuthor,
      language
    );

    // 🔍 AUTOMATIC RESEARCH: If plant not in database, trigger background research
    // This populates the researched_plants cache for future scans
    if (careData.needsResearch) {
      logger.info(`🌐 Triggering automatic research for: ${topResult.scientificNameWithoutAuthor}`);
      // Fire and forget - don't wait for research to complete
      import('./plantResearch').then(({ plantResearchService }) => {
        plantResearchService.research(
          topResult.scientificNameWithoutAuthor,
          commonName,
          topResult.family.scientificNameWithoutAuthor
        ).catch(err => logger.error('Background research failed:', err));
      });
    }

    // ✅ TIER MATCHING: Match PlantNet result to database for tier classification
    const databaseMatch = plantNetService.matchPlantToDatabase(
      topResult.scientificNameWithoutAuthor,
      topResult.genus.scientificNameWithoutAuthor,
      commonName,
      topResult.family.scientificNameWithoutAuthor,
      adjustedConfidence
    );

    // ✅ USE DATABASE NAME: When we have a database match, prefer its name over PlantNet's
    // This ensures "Song of Jamaica" shows instead of "Corn plant" for genus matches
    const displayName = databaseMatch.primary_plant_name || careData.plant_name;
    const displayScientificName = databaseMatch.primary_scientific_name || topResult.scientificNameWithoutAuthor;
    const displayInfo = databaseMatch.primary_plant_info || careData.plant_info;

    return {
      confidence: adjustedConfidence,
      common_name: displayName,
      scientific_name: displayScientificName, // ✅ FIX: Use database scientific name when matched
      family: topResult.family.scientificNameWithoutAuthor,
      genus: topResult.genus.scientificNameWithoutAuthor,
      plant_info: displayInfo,
      // 🌐 Arabic content from database match
      common_name_arabic: databaseMatch.primary_plant_name_arabic,
      plant_info_arabic: databaseMatch.primary_plant_info_arabic,
      plant_type: careData.plant_type,
      watering_schedule: careData.watering_frequency,
      preferred_humidity: 'medium', // Legacy field - info now in watering_schedule
      preferred_orientation: careData.orientation,
      database_match: databaseMatch, // ✅ TIER MATCHING: Determines Tier 1/2/3 classification
      // 🔧 FIX: Show up to 5 alternatives from PlantNet API
      alternatives: species.slice(1, 6).map(s => ({
        common_name: s.commonNames?.find((n: any) => n.lang === 'en')?.name || s.scientificNameWithoutAuthor,
        scientific_name: s.scientificNameWithoutAuthor,
        confidence: Math.round(s.score * 100)
      })),
      suggestions: []
    };
  },

  /**
   * Get common plants found in Egypt for suggestions (DEPRECATED - now uses database service)
   */
  getCommonEgyptianPlants: (language: 'en' | 'ar' = 'en'): string[] => {
    // Get beginner-friendly plants suitable for Cairo
    const cairoPlants = plantDatabaseService.getPlantsByCategory('cairo_excellent');
    
    return cairoPlants.slice(0, 10).map(plant => {
      if (language === 'ar') {
        return `${plant.names.arabic[0] || plant.names.common[0]} (${plant.names.common[0]})`;
      } else {
        return `${plant.names.common[0]} (${plant.names.arabic[0] || plant.names.scientific[0]})`;
      }
    });
  },

};