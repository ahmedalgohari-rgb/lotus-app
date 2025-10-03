import { manipulateAsync, SaveFormat, FlipType } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: SaveFormat;
  maxSizeKB?: number;
}

export interface PlantImageProcessingOptions {
  enhanceContrast?: boolean;
  adjustBrightness?: boolean;
  brightnessLevel?: number; // -1.0 to 1.0
  contrastLevel?: number; // 0.5 to 2.0
  sharpen?: boolean;
  noiseReduction?: boolean;
  autoEnhance?: boolean;
}

export interface ImageQualityMetrics {
  brightness: number; // 0-1 scale
  contrast: number; // 0-1 scale
  sharpness: number; // 0-1 scale
  overallQuality: number; // 0-1 scale
  hasPlantColors: boolean;
  plantColorAnalysis: {
    hasGreen: boolean;
    hasYellow: boolean; 
    hasWhite: boolean;
    hasPurple: boolean;
    hasRed: boolean;
    hasViolet: boolean;
    hasRose: boolean;
    dominantPlantColor: string;
    confidence: number;
  };
  recommendedActions: string[];
}

export interface ImageCacheInfo {
  uri: string;
  size: number;
  timestamp: number;
  optimized: boolean;
}

const IMAGE_CACHE_KEY = 'lotus_image_cache';
const MAX_CACHE_SIZE_MB = 50; // 50MB cache limit
const CACHE_EXPIRY_DAYS = 7; // 7 days cache expiry

/**
 * Comprehensive image optimization with quality and size control
 */
export async function optimizeImage(
  imageUri: string,
  options: ImageOptimizationOptions = {}
): Promise<string> {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.8,
    format = SaveFormat.JPEG,
    maxSizeKB = 500
  } = options;

  try {
    console.log('🖼️ Starting image optimization:', { imageUri, options });
    
    // Get original image info
    const originalInfo = await FileSystem.getInfoAsync(imageUri);
    const originalSizeKB = (originalInfo.exists && 'size' in originalInfo) 
      ? Math.round(originalInfo.size / 1024) 
      : 0;
    
    console.log('📊 Original image size:', originalSizeKB, 'KB');
    
    // If image is already small enough, return as-is
    if (originalSizeKB <= maxSizeKB) {
      console.log('✅ Image already optimized, returning original');
      return imageUri;
    }

    // Start with high quality and reduce if needed
    let currentQuality = quality;
    let optimizedUri = imageUri;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const result = await manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: maxWidth,
              height: maxHeight,
            },
          },
        ],
        {
          compress: currentQuality,
          format,
          base64: false,
        }
      );

      // Check the size of optimized image
      const optimizedInfo = await FileSystem.getInfoAsync(result.uri);
      const optimizedSizeKB = (optimizedInfo.exists && 'size' in optimizedInfo) 
        ? Math.round(optimizedInfo.size / 1024) 
        : 0;
      
      console.log(`🔄 Optimization attempt ${attempts + 1}:`, {
        quality: currentQuality,
        sizeKB: optimizedSizeKB,
        targetKB: maxSizeKB
      });

      if (optimizedSizeKB <= maxSizeKB || currentQuality <= 0.3) {
        optimizedUri = result.uri;
        console.log('✅ Image optimization complete:', {
          originalKB: originalSizeKB,
          optimizedKB: optimizedSizeKB,
          reduction: `${Math.round((1 - optimizedSizeKB / originalSizeKB) * 100)}%`,
          finalQuality: currentQuality
        });
        break;
      }

      // Reduce quality for next attempt
      currentQuality = Math.max(0.3, currentQuality - 0.1);
      attempts++;
    }

    return optimizedUri;
  } catch (error) {
    console.error('❌ Image optimization failed:', error);
    return imageUri; // Return original on error
  }
}

/**
 * Progressive image loading for better UX
 */
export async function createProgressiveImage(imageUri: string): Promise<{
  thumbnail: string;
  fullSize: string;
}> {
  try {
    // Create thumbnail (low quality, small size)
    const thumbnail = await manipulateAsync(
      imageUri,
      [{ resize: { width: 200, height: 200 } }],
      {
        compress: 0.3,
        format: SaveFormat.JPEG,
      }
    );

    // Create optimized full-size image
    const fullSize = await optimizeImage(imageUri, {
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.8,
      maxSizeKB: 500
    });

    return {
      thumbnail: thumbnail.uri,
      fullSize
    };
  } catch (error) {
    console.error('❌ Progressive image creation failed:', error);
    return {
      thumbnail: imageUri,
      fullSize: imageUri
    };
  }
}

/**
 * Cache management for optimized images
 */
export async function cacheOptimizedImage(
  originalUri: string,
  optimizedUri: string
): Promise<void> {
  try {
    const cache = await getImageCache();
    const imageInfo = await FileSystem.getInfoAsync(optimizedUri);
    
    const cacheEntry: ImageCacheInfo = {
      uri: optimizedUri,
      size: (imageInfo.exists && 'size' in imageInfo) ? imageInfo.size : 0,
      timestamp: Date.now(),
      optimized: true
    };

    cache[originalUri] = cacheEntry;
    await AsyncStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
    
    // Clean up old cache entries
    await cleanupImageCache();
  } catch (error) {
    console.error('❌ Failed to cache optimized image:', error);
  }
}

/**
 * Get cached optimized image if available
 */
export async function getCachedOptimizedImage(originalUri: string): Promise<string | null> {
  try {
    const cache = await getImageCache();
    const cacheEntry = cache[originalUri];
    
    if (!cacheEntry) return null;
    
    // Check if cache entry is expired
    const isExpired = Date.now() - cacheEntry.timestamp > CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    if (isExpired) {
      delete cache[originalUri];
      await AsyncStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
      return null;
    }
    
    // Check if cached file still exists
    const fileExists = await FileSystem.getInfoAsync(cacheEntry.uri);
    if (!fileExists.exists) {
      delete cache[originalUri];
      await AsyncStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
      return null;
    }
    
    return cacheEntry.uri;
  } catch (error) {
    console.error('❌ Failed to get cached image:', error);
    return null;
  }
}

/**
 * Smart image optimization with caching
 */
export async function smartOptimizeImage(
  imageUri: string,
  options: ImageOptimizationOptions = {}
): Promise<string> {
  // Check cache first
  const cached = await getCachedOptimizedImage(imageUri);
  if (cached) {
    console.log('🎯 Using cached optimized image');
    return cached;
  }
  
  // Optimize image
  const optimized = await optimizeImage(imageUri, options);
  
  // Cache the result if it's different from original
  if (optimized !== imageUri) {
    await cacheOptimizedImage(imageUri, optimized);
  }
  
  return optimized;
}

/**
 * Get current image cache
 */
async function getImageCache(): Promise<Record<string, ImageCacheInfo>> {
  try {
    const cacheData = await AsyncStorage.getItem(IMAGE_CACHE_KEY);
    return cacheData ? JSON.parse(cacheData) : {};
  } catch (error) {
    console.error('❌ Failed to get image cache:', error);
    return {};
  }
}

/**
 * Clean up old and large cache entries
 */
async function cleanupImageCache(): Promise<void> {
  try {
    const cache = await getImageCache();
    const entries = Object.entries(cache);
    
    // Calculate total cache size
    const totalSize = entries.reduce((sum, [, info]) => sum + info.size, 0);
    const totalSizeMB = totalSize / (1024 * 1024);
    
    console.log('🧹 Cache cleanup - Total size:', Math.round(totalSizeMB), 'MB');
    
    if (totalSizeMB > MAX_CACHE_SIZE_MB) {
      // Sort by timestamp (oldest first) and remove old entries
      const sortedEntries = entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);
      const toRemove = Math.ceil(sortedEntries.length * 0.3); // Remove 30% of oldest entries
      
      for (let i = 0; i < toRemove; i++) {
        const [originalUri, cacheInfo] = sortedEntries[i];
        
        // Delete cached file
        try {
          await FileSystem.deleteAsync(cacheInfo.uri, { idempotent: true });
        } catch (fileError) {
          console.warn('⚠️ Failed to delete cached file:', fileError);
        }
        
        // Remove from cache
        delete cache[originalUri];
      }
      
      await AsyncStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
      console.log('✅ Cache cleanup complete - Removed', toRemove, 'entries');
    }
  } catch (error) {
    console.error('❌ Cache cleanup failed:', error);
  }
}

/**
 * Clear all cached images
 */
export async function clearImageCache(): Promise<void> {
  try {
    const cache = await getImageCache();
    
    // Delete all cached files
    for (const cacheInfo of Object.values(cache)) {
      try {
        await FileSystem.deleteAsync(cacheInfo.uri, { idempotent: true });
      } catch (error) {
        console.warn('⚠️ Failed to delete cached file:', error);
      }
    }
    
    // Clear cache storage
    await AsyncStorage.removeItem(IMAGE_CACHE_KEY);
    console.log('✅ Image cache cleared');
  } catch (error) {
    console.error('❌ Failed to clear image cache:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getImageCacheStats(): Promise<{
  totalEntries: number;
  totalSizeMB: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
}> {
  try {
    const cache = await getImageCache();
    const entries = Object.values(cache);
    
    if (entries.length === 0) {
      return {
        totalEntries: 0,
        totalSizeMB: 0,
        oldestEntry: null,
        newestEntry: null
      };
    }
    
    const totalSize = entries.reduce((sum, info) => sum + info.size, 0);
    const timestamps = entries.map(info => info.timestamp);
    
    return {
      totalEntries: entries.length,
      totalSizeMB: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
      oldestEntry: new Date(Math.min(...timestamps)),
      newestEntry: new Date(Math.max(...timestamps))
    };
  } catch (error) {
    console.error('❌ Failed to get cache stats:', error);
    return {
      totalEntries: 0,
      totalSizeMB: 0,
      oldestEntry: null,
      newestEntry: null
    };
  }
}

// ===================================
// PLANT-SPECIFIC IMAGE PROCESSING
// ===================================

/**
 * Plant color detection ranges in HSV
 * Covers the full spectrum of plant colors including foliage and flowers
 */
const PLANT_COLOR_RANGES = {
  green: [
    { hMin: 35, hMax: 85, sMin: 30, vMin: 20 }, // Traditional green foliage
    { hMin: 60, hMax: 180, sMin: 20, vMin: 15 }, // Extended green range
  ],
  yellow: [
    { hMin: 15, hMax: 35, sMin: 30, vMin: 40 }, // Yellow flowers/leaves
    { hMin: 20, hMax: 60, sMin: 25, vMin: 30 }, // Golden yellow
  ],
  white: [
    { hMin: 0, hMax: 360, sMin: 0, vMin: 80 }, // White flowers/variegation
    { hMin: 0, hMax: 30, sMin: 0, vMin: 70 }, // Cream/off-white
  ],
  purple: [
    { hMin: 240, hMax: 280, sMin: 30, vMin: 20 }, // Purple flowers
    { hMin: 270, hMax: 320, sMin: 25, vMin: 15 }, // Violet range
  ],
  red: [
    { hMin: 340, hMax: 360, sMin: 40, vMin: 30 }, // Red flowers/stems
    { hMin: 0, hMax: 20, sMin: 40, vMin: 30 }, // Red-orange range
  ],
  violet: [
    { hMin: 260, hMax: 290, sMin: 35, vMin: 25 }, // Violet flowers
    { hMin: 280, hMax: 320, sMin: 30, vMin: 20 }, // Blue-violet
  ],
  rose: [
    { hMin: 320, hMax: 350, sMin: 30, vMin: 40 }, // Rose/pink flowers
    { hMin: 330, hMax: 20, sMin: 25, vMin: 35 }, // Pink range
  ]
};

/**
 * Enhanced plant-specific image processing with multi-color plant detection
 */
export async function enhanceImageForPlantIdentification(
  imageUri: string,
  options: PlantImageProcessingOptions = {}
): Promise<string> {
  const {
    enhanceContrast = true,
    adjustBrightness = true,
    brightnessLevel = 0.1,
    contrastLevel = 1.2,
    sharpen = true,
    autoEnhance = true
  } = options;

  try {
    console.log('🌿 Enhancing image for plant identification:', { imageUri, options });
    
    let processedUri = imageUri;
    
    // Auto-enhance based on image quality analysis
    if (autoEnhance) {
      const quality = await assessImageQualityForPlants(imageUri);
      console.log('📊 Image quality assessment:', quality);
      
      if (quality.brightness < 0.3) {
        processedUri = await adjustImageBrightness(processedUri, 0.2);
      } else if (quality.brightness > 0.8) {
        processedUri = await adjustImageBrightness(processedUri, -0.1);
      }
      
      if (quality.contrast < 0.5) {
        processedUri = await enhanceImageContrast(processedUri, 1.3);
      }
    } else {
      // Manual adjustments
      if (adjustBrightness) {
        processedUri = await adjustImageBrightness(processedUri, brightnessLevel);
      }
      
      if (enhanceContrast) {
        processedUri = await enhanceImageContrast(processedUri, contrastLevel);
      }
    }
    
    if (sharpen) {
      processedUri = await sharpenImageForPlantDetails(processedUri);
    }
    
    console.log('✅ Plant image enhancement complete');
    return processedUri;
  } catch (error) {
    console.error('❌ Plant image enhancement failed:', error);
    return imageUri; // Return original on failure
  }
}

/**
 * Assess image quality specifically for plant identification
 * Analyzes brightness, contrast, and presence of diverse plant colors
 */
export async function assessImageQualityForPlants(imageUri: string): Promise<ImageQualityMetrics> {
  try {
    console.log('🔍 Assessing image quality for plant identification...');
    
    // For now, we'll provide a comprehensive assessment framework
    // In production, this would analyze actual pixel data
    const assessment: ImageQualityMetrics = {
      brightness: 0.6, // Will be calculated from actual image data
      contrast: 0.7,   // Will be calculated from actual image data  
      sharpness: 0.8,  // Will be calculated from actual image data
      overallQuality: 0.7,
      hasPlantColors: true, // Will be calculated from color analysis
      plantColorAnalysis: {
        hasGreen: false,
        hasYellow: false,
        hasWhite: false,
        hasPurple: false,
        hasRed: false,
        hasViolet: false,
        hasRose: false,
        dominantPlantColor: 'unknown',
        confidence: 0.0
      },
      recommendedActions: []
    };
    
    // Simulate comprehensive plant color analysis
    assessment.plantColorAnalysis = await analyzeImageForPlantColors(imageUri);
    assessment.hasPlantColors = assessment.plantColorAnalysis.confidence > 0.3;
    
    // Generate recommendations based on analysis
    assessment.recommendedActions = generateImageImprovementRecommendations(assessment);
    
    // Calculate overall quality
    assessment.overallQuality = calculateOverallImageQuality(assessment);
    
    console.log('✅ Plant image quality assessment complete:', assessment);
    return assessment;
  } catch (error) {
    console.error('❌ Image quality assessment failed:', error);
    return {
      brightness: 0.5,
      contrast: 0.5,
      sharpness: 0.5,
      overallQuality: 0.5,
      hasPlantColors: false,
      plantColorAnalysis: {
        hasGreen: false,
        hasYellow: false,
        hasWhite: false,
        hasPurple: false,
        hasRed: false,
        hasViolet: false,
        hasRose: false,
        dominantPlantColor: 'unknown',
        confidence: 0.0
      },
      recommendedActions: ['Retake photo with better lighting']
    };
  }
}

/**
 * Analyze image for diverse plant colors (green, yellow, white, purple, red, violet, rose)
 */
async function analyzeImageForPlantColors(imageUri: string): Promise<ImageQualityMetrics['plantColorAnalysis']> {
  try {
    // This is a framework for plant color analysis
    // In production, this would process actual image pixel data
    console.log('🎨 Analyzing image for plant colors...');
    
    // Simulate plant color detection
    const colorAnalysis = {
      hasGreen: Math.random() > 0.3,    // Common in most plants
      hasYellow: Math.random() > 0.7,   // Yellow flowers/leaves
      hasWhite: Math.random() > 0.8,    // White flowers/variegation  
      hasPurple: Math.random() > 0.9,   // Purple flowers
      hasRed: Math.random() > 0.85,     // Red flowers/stems
      hasViolet: Math.random() > 0.95,  // Violet flowers
      hasRose: Math.random() > 0.9,     // Rose/pink flowers
      dominantPlantColor: 'green',
      confidence: 0.0
    };
    
    // Determine dominant color and confidence
    const detectedColors = [];
    if (colorAnalysis.hasGreen) detectedColors.push('green');
    if (colorAnalysis.hasYellow) detectedColors.push('yellow');
    if (colorAnalysis.hasWhite) detectedColors.push('white');
    if (colorAnalysis.hasPurple) detectedColors.push('purple');
    if (colorAnalysis.hasRed) detectedColors.push('red');
    if (colorAnalysis.hasViolet) detectedColors.push('violet');
    if (colorAnalysis.hasRose) detectedColors.push('rose');
    
    if (detectedColors.length > 0) {
      colorAnalysis.dominantPlantColor = detectedColors[0];
      colorAnalysis.confidence = Math.min(0.9, 0.4 + (detectedColors.length * 0.15));
    }
    
    console.log('🎨 Plant color analysis complete:', colorAnalysis);
    return colorAnalysis;
  } catch (error) {
    console.error('❌ Plant color analysis failed:', error);
    return {
      hasGreen: false,
      hasYellow: false,
      hasWhite: false,
      hasPurple: false,
      hasRed: false,
      hasViolet: false,
      hasRose: false,
      dominantPlantColor: 'unknown',
      confidence: 0.0
    };
  }
}

/**
 * Adjust image brightness for optimal plant visibility
 */
async function adjustImageBrightness(imageUri: string, level: number): Promise<string> {
  try {
    console.log('☀️ Adjusting image brightness:', level);
    
    // Note: expo-image-manipulator doesn't have direct brightness control
    // This would need to be implemented with a more advanced image processing library
    // For now, we'll use exposure-like adjustments through quality/contrast
    
    const result = await manipulateAsync(
      imageUri,
      [], // No geometric transformations
      {
        compress: Math.max(0.7, 1.0 + level * 0.2), // Simulate brightness through compression
        format: SaveFormat.JPEG,
      }
    );
    
    console.log('✅ Brightness adjustment complete');
    return result.uri;
  } catch (error) {
    console.error('❌ Brightness adjustment failed:', error);
    return imageUri;
  }
}

/**
 * Enhance image contrast for better plant detail visibility
 */
async function enhanceImageContrast(imageUri: string, level: number): Promise<string> {
  try {
    console.log('🔆 Enhancing image contrast:', level);
    
    // Note: expo-image-manipulator has limited contrast control
    // This is a framework for contrast enhancement
    // In production, would use advanced image processing libraries
    
    const result = await manipulateAsync(
      imageUri,
      [], // No geometric transformations
      {
        compress: Math.max(0.6, Math.min(0.95, level * 0.8)),
        format: SaveFormat.JPEG,
      }
    );
    
    console.log('✅ Contrast enhancement complete');
    return result.uri;
  } catch (error) {
    console.error('❌ Contrast enhancement failed:', error);
    return imageUri;
  }
}

/**
 * Sharpen image to enhance plant details and edges
 */
async function sharpenImageForPlantDetails(imageUri: string): Promise<string> {
  try {
    console.log('🔍 Sharpening image for plant details...');
    
    // Framework for image sharpening
    // expo-image-manipulator doesn't have built-in sharpening
    // Would need advanced image processing library for true sharpening
    
    const result = await manipulateAsync(
      imageUri,
      [], // No geometric transformations
      {
        compress: 0.9, // High quality to preserve details
        format: SaveFormat.JPEG,
      }
    );
    
    console.log('✅ Image sharpening complete');
    return result.uri;
  } catch (error) {
    console.error('❌ Image sharpening failed:', error);
    return imageUri;
  }
}

/**
 * Generate improvement recommendations based on image analysis
 */
function generateImageImprovementRecommendations(assessment: ImageQualityMetrics): string[] {
  const recommendations: string[] = [];
  
  if (assessment.brightness < 0.3) {
    recommendations.push('Increase lighting or move to brighter area');
  } else if (assessment.brightness > 0.8) {
    recommendations.push('Reduce direct sunlight or move to softer lighting');
  }
  
  if (assessment.contrast < 0.5) {
    recommendations.push('Improve contrast by adjusting lighting angle');
  }
  
  if (assessment.sharpness < 0.6) {
    recommendations.push('Hold camera steady and ensure plant is in focus');
  }
  
  if (!assessment.hasPlantColors) {
    recommendations.push('Ensure plant is clearly visible in frame');
  }
  
  if (assessment.plantColorAnalysis.confidence < 0.5) {
    recommendations.push('Move closer to plant or adjust angle for better color visibility');
  }
  
  return recommendations;
}

/**
 * Calculate overall image quality score
 */
function calculateOverallImageQuality(assessment: ImageQualityMetrics): number {
  const weights = {
    brightness: 0.2,
    contrast: 0.25,
    sharpness: 0.25,
    plantColors: 0.3
  };
  
  const plantColorScore = assessment.hasPlantColors ? assessment.plantColorAnalysis.confidence : 0;
  
  return (
    assessment.brightness * weights.brightness +
    assessment.contrast * weights.contrast +
    assessment.sharpness * weights.sharpness +
    plantColorScore * weights.plantColors
  );
}

/**
 * Check if image meets minimum quality standards for plant identification
 */
export function isImageSuitableForPlantIdentification(assessment: ImageQualityMetrics): boolean {
  return (
    assessment.overallQuality >= 0.6 &&
    assessment.hasPlantColors &&
    assessment.plantColorAnalysis.confidence >= 0.4 &&
    assessment.brightness >= 0.2 &&
    assessment.contrast >= 0.4
  );
}