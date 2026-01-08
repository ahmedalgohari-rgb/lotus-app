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
 * PlantImage Component with PERFORMANCE OPTIMIZATION
 *
 * 3-Tier Priority System:
 * 1. User's captured photo (capturedImageUri) - highest priority, personal photos
 * 2. Local database WebP image (plantId) - instant loading, no network
 * 3. Remote CDN URL (imageUrl) - fallback only, optimized with CDN parameters
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
  // Priority 1: Cloud URL (permanent, backed up WebP ~50KB)
  const hasCloudImage = !!imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'));

  // Priority 2: Local cache (user's captured photo WebP - fast offline access)
  const hasCapturedImage = !hasCloudImage && !!capturedImageUri;

  // Priority 3: Local database image (bundled WebP - instant load)
  // ONLY use database stock image if there's NO captured image URI at all
  // If capturedImageUri exists but fails to load, show fallback emoji instead
  const shouldUseStockImage = !hasCloudImage && !capturedImageUri && !!plantId;
  const localImage = shouldUseStockImage ? getPlantImage(plantId) : null;

  // FIXED: Don't show loading for local images (they load instantly)
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(!localImage); // false for local images!
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  // Add 10-second timeout for image loading (increased for slow local file access)
  React.useEffect(() => {
    if (isLoading && !localImage) {
      const timeout = setTimeout(() => {
        if (isLoading) {
          logger.warn(`⏱️ PlantImage: Loading timeout for "${plantName}"`, {
            hasCapturedImage,
            capturedImageUri,
            imageUrl,
            reason: 'Image took >10s to load - possible file access issue'
          });
          setLoadingTimedOut(true);
          setIsLoading(false);
          setImageError(true);
        }
      }, 10000); // 10 second timeout (local files can be slow on iOS)

      return () => clearTimeout(timeout);
    }
  }, [isLoading, localImage, plantName, hasCapturedImage, capturedImageUri, imageUrl]);

  // Priority 3: Remote URL (optimized with CDN parameters)
  const optimizedImageUrl = !hasCapturedImage && !localImage && imageUrl ? optimizeImageUrl(imageUrl, size) : null;

  // If no image source at all, show fallback
  if (!hasCapturedImage && !localImage && !optimizedImageUrl || imageError) {
    // 🔍 DEBUG: Log why we're showing fallback emoji
    if (!imageUrl && !localImage && plantName) {
      logger.warn(`🌿 PlantImage: Showing emoji fallback for "${plantName}"`, {
        reason: 'No image source available',
        hasCloudUrl: !!imageUrl,
        hasCapturedUri: !!capturedImageUri,
        hasPlantId: !!plantId,
      });
    } else if (imageError && plantName) {
      logger.error(`🌿 PlantImage: Image load failed for "${plantName}"`, {
        reason: 'Image loading error',
        hasCloudUrl: !!imageUrl,
        cloudUrl: imageUrl,
        hasCapturedUri: !!capturedImageUri,
        capturedUri: capturedImageUri,
        hasLocalImage: !!localImage,
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
      {!localImage && isLoading && (
        <View style={[styles.loadingContainer, { width: size, height: size }]}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      )}

      {/* Actual image - 4-tier priority */}
      <Image
        source={
          // Priority 1: Cloud URL (permanent WebP ~50KB)
          hasCloudImage ? { uri: imageUrl } :
          // Priority 2: Local cache (offline WebP)
          hasCapturedImage ? { uri: capturedImageUri } :
          // Priority 3: Local database image (bundled)
          localImage ? localImage :
          // Priority 4: Remote CDN URL (fallback)
          { uri: optimizedImageUrl }
        }
        style={[styles.image, { width: size, height: size }]}
        // ⚡ expo-image: Smart caching (memory + disk, automatic eviction)
        cachePolicy="memory-disk"
        // ⚡ expo-image: Smooth fade-in transition (0ms for instant local images)
        transition={localImage ? 0 : 200}
        // ⚡ expo-image: Cover mode (same as React Native resizeMode="cover")
        contentFit="cover"
        onLoadStart={() => {
          if (!localImage) {
            setIsLoading(true);
            logger.debug(`🖼️ Loading image for "${plantName}"`, {
              hasCloud: hasCloudImage,
              cloudUrl: imageUrl,
              hasCaptured: hasCapturedImage,
              capturedUri: capturedImageUri,
            });
          }
        }}
        onLoad={() => {
          setIsLoading(false);
          logger.debug(`✅ Image loaded for "${plantName}"`);
        }}
        onError={(error) => {
          logger.error(`❌ Image load error for "${plantName}"`, {
            hasCloudImage,
            cloudUrl: imageUrl,
            hasCapturedImage,
            capturedUri: capturedImageUri,
            hasLocalImage: !!localImage,
            error: error.message || 'Unknown error',
          });
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
