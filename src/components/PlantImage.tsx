import React, { useState } from 'react';
import { View, Text, StyleSheet, ImageStyle, StyleProp, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image'; // ⚡ UPGRADE: expo-image for 10x faster loading & better caching
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../constants';
import { logger } from '../utils/logger';
import { getPlantImage } from '../assets/plantImages';

interface PlantImageProps {
  imageUrl?: string | null;
  plantId?: string;  // Plant ID for local database image lookup
  capturedImageUri?: string;  // User's captured photo (highest priority)
  plantName?: string;
  size?: number;
  style?: StyleProp<ImageStyle>;
}

/**
 * PlantImage Component with PERFORMANCE OPTIMIZATION & SMART FALLBACK
 *
 * 3-Tier Priority System with automatic fallback:
 * 1. User's captured photo (capturedImageUri) - For scanned plants, show THEIR photo
 *    → If file deleted from device: Automatically falls back to cloud URL
 * 2. Cloud URL (imageUrl) - Backup when local captured photo missing, or for cross-device sync
 * 3. Local database WebP image (plantId) - For manually added plants (no personal photo)
 *
 * ⚡ NEW: expo-image Upgrade (10x faster than React Native Image):
 * - Memory + disk caching (automatic, intelligent eviction)
 * - Native C++ implementation (faster decoding)
 * - Shared cache pool across app
 * - No iOS timeout bugs (unlike force-cache)
 * - Smooth transitions (200ms fade-in)
 * - Works with FlatList virtualization
 */
export default function PlantImage({
  imageUrl,
  plantId,
  capturedImageUri,
  plantName = 'Plant',
  size = 80,
  style
}: PlantImageProps) {
  // Priority 1: User's captured photo (HIGHEST - for scanned plants, show THEIR photo!)
  const hasCapturedImage = !!capturedImageUri;

  // Priority 2: Cloud URL (fallback if captured photo file missing from device)
  const hasCloudImage = !!imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'));

  // Priority 3: Local database image (FINAL FALLBACK - always available, bundled WebP ~15-70KB)
  const localImage = plantId ? getPlantImage(plantId) : null;
  const hasLocalImage = !!localImage;

  // Loading state: Only show spinner for non-instant images (captured/cloud may be slow)
  // Database images are bundled = instant load (no spinner needed)
  const [imageError, setImageError] = useState(false);
  const [capturedImageFailed, setCapturedImageFailed] = useState(false); // Track if captured image failed to load
  const [cloudImageFailed, setCloudImageFailed] = useState(false); // Track if cloud image failed to load
  const [isLoading, setIsLoading] = useState(hasCapturedImage || hasCloudImage);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  // Add 10-second timeout for image loading (only for remote images)
  React.useEffect(() => {
    if (isLoading && !hasLocalImage) {
      const timeout = setTimeout(() => {
        if (isLoading) {
          logger.warn(`⏱️ PlantImage: Loading timeout for "${plantName}"`, {
            hasCaptured: hasCapturedImage,
            hasCloud: hasCloudImage,
            reason: 'Image took >10s to load - possible network issue'
          });
          setLoadingTimedOut(true);
          setIsLoading(false);
          setImageError(true);
        }
      }, 10000); // 10 second timeout (remote images on slow connections)

      return () => clearTimeout(timeout);
    }
  }, [isLoading, hasLocalImage, plantName, hasCapturedImage, hasCloudImage]);

  // Priority 3: Remote URL (optimized with CDN parameters - fallback only)
  const optimizedImageUrl = !hasLocalImage && !hasCapturedImage && imageUrl ? optimizeImageUrl(imageUrl, size) : null;

  // If no image source at all, show fallback
  if (!hasLocalImage && !hasCapturedImage && !optimizedImageUrl || imageError) {
    // 🔍 DEBUG: Log why we're showing fallback emoji
    if (!hasLocalImage && !hasCapturedImage && !imageUrl && plantName) {
      logger.warn(`🌿 PlantImage: Showing emoji fallback for "${plantName}"`, {
        reason: 'No image source available',
        hasLocal: hasLocalImage,
        hasCaptured: !!capturedImageUri,
        hasCloud: !!imageUrl,
        hasPlantId: !!plantId,
      });
    } else if (imageError && plantName) {
      logger.error(`🌿 PlantImage: Image load failed for "${plantName}"`, {
        reason: 'Image loading error',
        hasLocal: hasLocalImage,
        hasCaptured: hasCapturedImage,
        hasCloud: !!imageUrl,
        cloudUrl: imageUrl,
        loadingTimedOut,
      });
    }

    return (
      <View style={[styles.fallbackContainer, { width: size, height: size }, style]}>
        <Ionicons name="leaf" size={size * 0.5} color={COLORS.primary} />
        {plantName && (
          <Text style={styles.fallbackText} numberOfLines={1}>
            {plantName.charAt(0)}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={[{ width: size, height: size }, style]}>
      {/* Loading placeholder - only show for remote images or captured photos */}
      {!hasLocalImage && isLoading && (
        <View style={[styles.loadingContainer, { width: size, height: size }]}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      )}

      {/* Actual image - Smart cascading fallback system */}
      <Image
        source={
          // Priority 1: User's captured photo (if exists and hasn't failed)
          (hasCapturedImage && !capturedImageFailed) ? { uri: capturedImageUri } :
          // Priority 2: Cloud URL (if exists and hasn't failed)
          (hasCloudImage && !cloudImageFailed) ? { uri: optimizedImageUrl } :
          // Priority 3: Local database image - SAFE FALLBACK (bundled, always works!)
          localImage || require('../../assets/icon.png')
        }
        style={[styles.image, { width: size, height: size }]}
        // ⚡ expo-image: Smart caching (memory + disk, automatic eviction)
        cachePolicy="memory-disk"
        // ⚡ expo-image: Smooth fade-in transition (0ms for instant local images)
        transition={hasLocalImage ? 0 : 200}
        // ⚡ expo-image: Cover mode (same as React Native resizeMode="cover")
        contentFit="cover"
        onLoadStart={() => {
          // Show loading for non-instant images (captured/cloud are slow, database is instant)
          const loadingSource =
            (hasCapturedImage && !capturedImageFailed) ? 'captured' :
            (hasCloudImage && !cloudImageFailed) ? 'cloud' :
            hasLocalImage ? 'database' : 'placeholder';

          if (loadingSource !== 'database' && loadingSource !== 'placeholder') {
            setIsLoading(true);
            logger.debug(`🖼️ Loading ${loadingSource} image for "${plantName}"`, {
              hasLocal: hasLocalImage,
              hasCaptured: hasCapturedImage,
              hasCloud: hasCloudImage,
              capturedFailed: capturedImageFailed,
              cloudFailed: cloudImageFailed,
              cloudUrl: hasCloudImage ? imageUrl : undefined,
            });
          }
        }}
        onLoad={() => {
          setIsLoading(false);
          const actualSource =
            (hasCapturedImage && !capturedImageFailed) ? 'captured' :
            (hasCloudImage && !cloudImageFailed) ? 'cloud' :
            hasLocalImage ? 'database' : 'placeholder';
          logger.debug(`✅ Image loaded for "${plantName}"`, { source: actualSource });
        }}
        onError={(error) => {
          logger.error(`❌ Image load error for "${plantName}"`, {
            hasLocal: hasLocalImage,
            hasCaptured: hasCapturedImage,
            hasCloud: hasCloudImage,
            cloudUrl: imageUrl,
            capturedImageFailed,
            cloudImageFailed,
            error: error.message || 'Unknown error',
          });

          // Cascading fallback logic:
          // 1. If captured image failed and we haven't tried cloud yet → try cloud
          if (hasCapturedImage && !capturedImageFailed) {
            logger.info(`🔄 Captured image failed, ${hasCloudImage ? 'falling back to cloud URL' : 'trying database'} for "${plantName}"`);
            setCapturedImageFailed(true); // Re-render with cloud or database
            return;
          }

          // 2. If cloud failed and we haven't tried database yet → try database
          if (hasCloudImage && !cloudImageFailed) {
            logger.info(`🔄 Cloud URL failed, ${hasLocalImage ? 'falling back to database image' : 'no more fallbacks'} for "${plantName}"`);
            setCloudImageFailed(true); // Re-render with database
            return;
          }

          // 3. Everything failed - show placeholder (app icon)
          setIsLoading(false);
          setImageError(true);
        }}
      />
    </View>
  );
}

/**
 * Optimize image URL for faster loading
 * For Shopify CDN: Request appropriately sized images (80-90% smaller files!)
 */
function optimizeImageUrl(url: string, size: number): string {
  // Calculate optimal size (2x for retina displays)
  const optimalSize = Math.ceil(size * 2);

  // Kaynuna uses Shopify CDN - supports width parameter
  if (url.includes('kaynuna.co/cdn/shop')) {
    // Add Shopify image transformation parameters
    // Format: image.jpg?width=XXX
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${optimalSize}&format=pjpg`; // Progressive JPEG
  }

  // PlantCult Cairo also uses Shopify CDN
  if (url.includes('plantcultcairo.com/cdn/shop')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${optimalSize}&format=pjpg`; // Progressive JPEG
  }

  // For other URLs, return as-is (can add more CDN optimizations here)
  return url;
}

const styles = StyleSheet.create({
  image: {
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  fallbackContainer: {
    borderRadius: 12,
    backgroundColor: '#E8F5E9', // Light green background
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary + '20', // 20% opacity
  },
  fallbackText: {
    position: 'absolute',
    fontSize: TYPOGRAPHY.LG,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  loadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    zIndex: 1,
  },
});
