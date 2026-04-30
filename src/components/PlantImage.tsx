import React, { useState } from 'react';
import { View, Text, StyleSheet, ImageStyle, StyleProp, ActivityIndicator } from 'react-native';
import { Image, ImageSource } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../constants';
import { logger } from '../utils/logger';
import { getPlantImage } from '../assets/plantImages';

interface PlantImageProps {
  imageUrl?: string | null;
  plantId?: string;
  capturedImageUri?: string;
  plantName?: string;
  size?: number;
  style?: StyleProp<ImageStyle>;
}

/**
 * PlantImage Component with Smart Fallback System
 *
 * 3-Tier Priority:
 * 1. User's captured photo (capturedImageUri)
 * 2. Cloud URL (imageUrl)
 * 3. Local database WebP image (plantId)
 */
export default function PlantImage({
  imageUrl,
  plantId,
  capturedImageUri,
  plantName = 'Plant',
  size = 80,
  style
}: PlantImageProps): JSX.Element {
  const hasCapturedImage = !!capturedImageUri;
  const hasCloudImage = !!imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'));
  const localImage = plantId ? getPlantImage(plantId) : null;
  const hasLocalImage = !!localImage;

  const [imageError, setImageError] = useState(false);
  const [capturedImageFailed, setCapturedImageFailed] = useState(false);
  const [cloudImageFailed, setCloudImageFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(hasCapturedImage || hasCloudImage);

  // Reset loading state when image sources change
  React.useEffect(() => {
    setIsLoading(hasCapturedImage || hasCloudImage);
    setCapturedImageFailed(false);
    setCloudImageFailed(false);
    setImageError(false);
  }, [capturedImageUri, imageUrl]);

  // Timeout for remote image loading (8 seconds - enough for cellular)
  React.useEffect(() => {
    if (!isLoading) return;

    const timeout = setTimeout(() => {
      logger.warn(`PlantImage: Loading timeout for "${plantName}" - falling back`);
      setIsLoading(false);

      // If we have a captured image that timed out, mark it as failed to try next source
      if (hasCapturedImage && !capturedImageFailed) {
        logger.info(`Captured image timed out, trying ${hasCloudImage ? 'cloud' : 'database'}`);
        setCapturedImageFailed(true);
      } else if (hasCloudImage && !cloudImageFailed) {
        logger.info(`Cloud image timed out, trying ${hasLocalImage ? 'database' : 'placeholder'}`);
        setCloudImageFailed(true);
      } else {
        setImageError(true);
      }
    }, 8000);

    return () => clearTimeout(timeout);
  }, [isLoading, hasCapturedImage, hasCloudImage, hasLocalImage, capturedImageFailed, cloudImageFailed, plantName]);

  const optimizedImageUrl = hasCloudImage ? optimizeImageUrl(imageUrl!, size) : null;

  // Determine current image source based on fallback state
  function getImageSource(): { source: ImageSource; type: 'captured' | 'cloud' | 'database' | 'placeholder' } {
    if (hasCapturedImage && !capturedImageFailed) {
      return { source: { uri: capturedImageUri }, type: 'captured' };
    }
    if (hasCloudImage && !cloudImageFailed) {
      return { source: { uri: optimizedImageUrl! }, type: 'cloud' };
    }
    if (localImage) {
      return { source: localImage, type: 'database' };
    }
    return { source: require('../../assets/icon.png'), type: 'placeholder' };
  }

  // Show fallback if no image sources available or all failed
  const hasNoImageSource = !hasLocalImage && !hasCapturedImage && !optimizedImageUrl;
  if (hasNoImageSource || imageError) {
    if (hasNoImageSource && plantName) {
      logger.warn(`PlantImage: No image source for "${plantName}"`);
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

  const { source, type } = getImageSource();
  const isRemoteImage = type === 'captured' || type === 'cloud';

  function handleLoadStart(): void {
    if (isRemoteImage) {
      setIsLoading(true);
      logger.debug(`Loading ${type} image for "${plantName}"`);
    }
  }

  function handleLoad(): void {
    setIsLoading(false);
    logger.debug(`Image loaded for "${plantName}" (${type})`);
  }

  function handleError(event: { error: string }): void {
    logger.error(`Image load error for "${plantName}"`, {
      type,
      error: event.error || 'Unknown error',
    });

    // Cascade to next fallback
    if (hasCapturedImage && !capturedImageFailed) {
      logger.info(`Falling back from captured to ${hasCloudImage ? 'cloud' : 'database'} for "${plantName}"`);
      setCapturedImageFailed(true);
      return;
    }

    if (hasCloudImage && !cloudImageFailed) {
      logger.info(`Falling back from cloud to ${hasLocalImage ? 'database' : 'placeholder'} for "${plantName}"`);
      setCloudImageFailed(true);
      return;
    }

    setIsLoading(false);
    setImageError(true);
  }

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Image
        source={source}
        style={[styles.image, { width: size, height: size }]}
        cachePolicy="disk"
        transition={type === 'database' ? 0 : 200}
        contentFit="cover"
        onLoadStart={handleLoadStart}
        onLoad={handleLoad}
        onError={handleError}
        recyclingKey={`${type}-${capturedImageUri || imageUrl || plantId}`}
      />

      {isRemoteImage && isLoading && (
        <View style={[styles.loadingOverlay, { width: size, height: size }]}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      )}
    </View>
  );
}

/**
 * Optimize image URL for faster loading via CDN parameters
 */
function optimizeImageUrl(url: string, size: number): string {
  const optimalSize = Math.ceil(size * 2); // 2x for retina
  const separator = url.includes('?') ? '&' : '?';

  // Shopify CDN optimization
  if (url.includes('kaynuna.co/cdn/shop') || url.includes('plantcultcairo.com/cdn/shop')) {
    return `${url}${separator}width=${optimalSize}&format=pjpg`;
  }

  return url;
}

const styles = StyleSheet.create({
  image: {
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  fallbackContainer: {
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary + '20',
  },
  fallbackText: {
    position: 'absolute',
    fontSize: TYPOGRAPHY.LG,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  loadingOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent so image shows through
    borderRadius: 12,
    top: 0,
    left: 0,
  },
});
