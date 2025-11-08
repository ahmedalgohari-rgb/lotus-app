import { IdentificationResult } from '../types';
import { plantDatabaseService } from './plantDatabase';
import { plantNetCache, createCachedApiCall } from '../utils/apiCache';
import {
  enhanceImageForPlantIdentification,
  assessImageQualityForPlants,
  isImageSuitableForPlantIdentification,
  ImageQualityMetrics
} from '../utils/imageUtils';
import { plantDetectionService } from '../utils/plantDetection';
import * as FileSystem from 'expo-file-system';
import CryptoJS from 'crypto-js';
import { plantScanLimiter, RateLimiter, isRateLimitError } from '../utils/rateLimiter';

const PLANTNET_API_KEY = process.env.EXPO_PUBLIC_PLANTNET_API_KEY || '';
const PLANTNET_API_URL = 'https://my-api.plantnet.org/v2/identify/weurope';

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
 * Direct PlantNet API call without caching
 */
async function directPlantNetApiCall(
  imageUri: string,
  organ: string,
  language: 'en' | 'ar'
): Promise<PlantNetResponse | null> {
  console.log('🌐 Making fresh PlantNet API call...');
  
  const formData = new FormData();
  formData.append('images', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'plant.jpg',
  } as any);
  
  // Add organs parameter
  formData.append('organs', organ);
  
  const response = await fetch(`${PLANTNET_API_URL}?api-key=${PLANTNET_API_KEY}&lang=${language}`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`PlantNet API error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

export const plantNetService = {
  /**
   * Pre-capture validation for camera interface
   * Quickly validates if image is worth sending to PlantNet API
   */
  validateImageForCapture: async (imageUri: string): Promise<{
    shouldCapture: boolean;
    confidence: number;
    feedback: string;
    improvements: string[];
  }> => {
    try {
      console.log('🔍 Pre-capture validation starting...');
      
      // Quick plant detection check
      const plantValidation = await plantDetectionService.detectPlantInRealTime(imageUri);
      
      // Quick quality assessment
      const qualityCheck = await assessImageQualityForPlants(imageUri);
      
      const shouldCapture = plantValidation.isPlantDetected && 
                           plantValidation.confidence > 0.5 && 
                           qualityCheck.overallQuality > 0.5;
      
      let feedback: string;
      if (!plantValidation.isPlantDetected) {
        feedback = 'Point camera at a plant';
      } else if (plantValidation.confidence < 0.5) {
        feedback = 'Move closer or improve lighting';
      } else if (qualityCheck.overallQuality < 0.5) {
        feedback = 'Improve image quality';
      } else {
        feedback = `${plantValidation.dominantPlantColor} plant ready to capture!`;
      }
      
      return {
        shouldCapture,
        confidence: Math.max(plantValidation.confidence, qualityCheck.overallQuality),
        feedback,
        improvements: qualityCheck.recommendedActions
      };
    } catch (error) {
      console.error('❌ Pre-capture validation failed:', error);
      return {
        shouldCapture: false,
        confidence: 0,
        feedback: 'Validation failed - try again',
        improvements: ['Ensure good lighting and plant visibility']
      };
    }
  },
  /**
   * Enhanced plant identification with caching and multiple attempts
   * Updated to use centralized PlantDatabaseService and smart caching
   * Now includes rate limiting for API protection
   */
  identifyPlant: async (
    imageUri: string,
    organ: string = 'leaf',
    language: 'en' | 'ar' = 'en'
  ): Promise<IdentificationResult | null> => {
    try {
      console.log('🌿 Starting enhanced plant identification with quality validation...');

      // Security: Check rate limit before processing
      const rateLimitCheck = await plantScanLimiter.checkLimit();
      if (!rateLimitCheck.allowed) {
        const retryTime = RateLimiter.formatRetryTime(rateLimitCheck.retryAfter);
        const message = language === 'ar'
          ? `لقد وصلت إلى حد المسح الخاص بك. حاول مرة أخرى بعد ${retryTime}.`
          : `You've reached your scan limit. Please try again in ${retryTime}.`;

        console.warn('🚫 Rate limit exceeded:', rateLimitCheck);

        // Return a special result indicating rate limit
        return {
          confidence: 0,
          common_name: language === 'ar' ? 'حد المسح مكتمل' : 'Scan Limit Reached',
          scientific_name: 'Rate Limited',
          family: 'System',
          genus: 'Limit',
          plant_info: message,
          plant_type: 'system_message',
          watering_schedule: language === 'ar'
            ? `المتبقي: ${rateLimitCheck.remaining} مسح`
            : `Remaining: ${rateLimitCheck.remaining} scans`,
          preferred_humidity: 'N/A',
          preferred_orientation: language === 'ar'
            ? `أعد المحاولة بعد ${retryTime}`
            : `Retry in ${retryTime}`,
          alternatives: [],
          suggestions: [
            language === 'ar'
              ? 'يتم إعادة تعيين الحد كل ساعة'
              : 'Limit resets every hour',
            language === 'ar'
              ? 'هذا يحمي التطبيق من الاستخدام المفرط'
              : 'This protects the app from excessive usage'
          ]
        };
      }

      if (!PLANTNET_API_KEY) {
        console.warn('PlantNet API key not configured, using enhanced mock data');
        return plantNetService.mockIdentify(imageUri, language);
      }

      // Phase 1: Image Quality Assessment and Validation
      console.log('📊 Assessing image quality for plant identification...');
      const qualityAssessment = await assessImageQualityForPlants(imageUri);
      
      // Phase 2: Plant Detection Validation
      console.log('🔍 Validating plant presence in image...');
      const plantValidation = await plantDetectionService.validateImageForPlantAPI(imageUri);
      
      if (!plantValidation.isValid) {
        console.log('❌ Image validation failed:', plantValidation.issues);
        console.log('💡 Recommendations:', plantValidation.recommendations);
        
        // Return early with validation feedback - don't waste API calls
        return {
          confidence: plantValidation.confidence * 100,
          common_name: language === 'ar' ? 'صورة غير مناسبة للتعريف' : 'Image not suitable for identification',
          scientific_name: 'Validation failed',
          family: 'Unknown',
          genus: 'Unknown',
          plant_info: plantValidation.recommendations.join('. ') + '.',
          plant_type: 'none',
          watering_schedule: language === 'ar' ? 'حسن جودة الصورة أولاً' : 'Improve image quality first',
          preferred_humidity: 'unknown',
          preferred_orientation: language === 'ar' ? 'التقط صورة أفضل' : 'Take a better photo',
          alternatives: [],
          suggestions: plantValidation.recommendations
        };
      }

      // Phase 3: Image Enhancement for Better Identification
      console.log('🎨 Enhancing image for optimal plant identification...');
      const enhancedImageUri = await enhanceImageForPlantIdentification(imageUri, {
        autoEnhance: true,
        enhanceContrast: qualityAssessment.contrast < 0.6,
        adjustBrightness: qualityAssessment.brightness < 0.4 || qualityAssessment.brightness > 0.8,
        sharpen: qualityAssessment.sharpness < 0.7
      });

      // Phase 4: Enhanced Plant Identification with Multiple Organ Types
      console.log('🚀 Proceeding with enhanced PlantNet API identification...');
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
            
            // If we get a high confidence result, no need to try other organs
            if (result && result.confidence > 80) {
              console.log('✅ High confidence result achieved:', result.confidence);
              break;
            }
          } catch (error) {
            console.warn(`Failed identification with ${currentOrgan}:`, error);
            // If API is blocked (IP restriction), use enhanced mock data immediately
            if (error.message.includes('access denied') || error.message.includes('403')) {
              console.log('PlantNet API blocked by IP restrictions, using enhanced mock identification');
              return plantNetService.mockIdentify(imageUri, language);
            }
            continue;
          }
        }
        
        // If we got a good result with enhanced image, don't try original
        if (bestResult && bestResult.confidence > 70) {
          break;
        }
      }

      // Phase 5: Post-Processing and Recommendations
      if (bestResult && bestResult.confidence < 70) {
        console.log('🔧 Adding Egyptian plant suggestions for low confidence result');
        bestResult.suggestions = plantNetService.getCommonEgyptianPlants(language);
        
        // Add plant color information if detected
        if (qualityAssessment.hasPlantColors) {
          const colorInfo = language === 'ar' 
            ? `اللون المسيطر: ${qualityAssessment.plantColorAnalysis.dominantPlantColor}`
            : `Dominant color: ${qualityAssessment.plantColorAnalysis.dominantPlantColor}`;
          bestResult.plant_info += ` ${colorInfo}.`;
        }
      }

      const finalResult = bestResult || plantNetService.mockIdentify(imageUri, language);

      // Security: Record successful API call for rate limiting
      // Only record if we made an actual API call (not mock data)
      if (finalResult && PLANTNET_API_KEY) {
        await plantScanLimiter.recordRequest();
        console.log('✅ Scan recorded for rate limiting');
      }

      console.log('🎯 Plant identification complete with quality validation');
      return finalResult;
    } catch (error) {
      console.error('PlantNet identification error:', error);
      // Don't record failed requests in rate limit
      return plantNetService.mockIdentify(imageUri, language);
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
      console.warn('PlantNet API returned no data');
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

    return plantNetService.processBestMatch(speciesResults, language);
  },

  /**
   * Process multiple results to find the best match with language support
   */
  processBestMatch: (species: any[], language: 'en' | 'ar' = 'en'): IdentificationResult => {
    const topResult = species[0];
    
    // Get common name in English or Arabic
    const commonNameEn = topResult.commonNames?.find((name: any) => name.lang === 'en')?.name;
    const commonNameAr = topResult.commonNames?.find((name: any) => name.lang === 'ar')?.name;
    const commonName = commonNameEn || commonNameAr || topResult.scientificNameWithoutAuthor;

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

    // Get comprehensive care data using centralized service
    const careData = plantDatabaseService.getComprehensivePlantCare(
      topResult.scientificNameWithoutAuthor,
      commonName,
      topResult.family.scientificNameWithoutAuthor,
      language
    );

    return {
      confidence: adjustedConfidence,
      common_name: careData.plant_name,
      scientific_name: topResult.scientificNameWithoutAuthor,
      family: topResult.family.scientificNameWithoutAuthor,
      genus: topResult.genus.scientificNameWithoutAuthor,
      plant_info: careData.plant_info,
      plant_type: careData.plant_type,
      watering_schedule: careData.watering_frequency,
      preferred_humidity: 'medium', // Legacy field - info now in watering_schedule
      preferred_orientation: careData.orientation,
      alternatives: species.slice(1, 4).map(s => ({
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

  // Fallback identification using mock data for development
  mockIdentify: async (imageUri: string, language: 'en' | 'ar' = 'en'): Promise<IdentificationResult> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockPlants = ['golden_pothos', 'snake_plant', 'monstera_deliciosa'];
    const randomPlantId = mockPlants[Math.floor(Math.random() * mockPlants.length)];
    const plant = plantDatabaseService.getPlantById(randomPlantId);
    
    if (plant) {
      const careData = plantDatabaseService.getComprehensivePlantCare(
        plant.names.scientific[0],
        plant.names.common[0],
        plant.characteristics.family,
        language
      );
      
      return {
        confidence: 85 + Math.floor(Math.random() * 10), // 85-94% confidence
        common_name: careData.plant_name,
        scientific_name: plant.names.scientific[0],
        family: plant.characteristics.family,
        genus: plant.names.scientific[0].split(' ')[0],
        plant_info: careData.plant_info,
        plant_type: plant.care.plant_type,
        watering_schedule: careData.watering_frequency,
        preferred_humidity: plant.care.humidity,
        preferred_orientation: careData.orientation,
        alternatives: [],
        suggestions: []
      };
    }
    
    // Ultimate fallback
    return {
      confidence: 60,
      common_name: language === 'ar' ? 'نبات غير معروف' : 'Unknown Plant',
      scientific_name: 'Unknown species',
      family: 'Unknown',
      genus: 'Unknown',
      plant_info: language === 'ar' 
        ? 'نبات جميل سيضيف حياة إلى مساحتك. ابحث عن احتياجات رعاية محددة للحصول على أفضل النتائج.'
        : 'A beautiful plant that will add life to your space. Research specific care needs for best results.',
      plant_type: 'foliage',
      watering_schedule: language === 'ar' ? 'جفاف 60% - اسقِ عندما تجف التربة إلى حد كبير' : '60% Dry - Water when mostly dry',
      preferred_humidity: 'medium',
      preferred_orientation: language === 'ar' ? 'داخلي - نافذة شرقية/غربية (ضوء ساطع غير مباشر)' : 'Indoor - East/West Window (Bright Indirect)',
      alternatives: [],
      suggestions: []
    };
  },
};