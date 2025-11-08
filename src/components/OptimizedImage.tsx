import React, { useState, useEffect, memo } from 'react';
import { Image, View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../constants';
import { logger } from '../utils/logger';

interface OptimizedImageProps {
  uri: string;
  style?: any;
  thumbnail?: string;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  onError?: (error: any) => void;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

/**
 * Optimized image component with progressive loading and memory management
 */
const OptimizedImage: React.FC<OptimizedImageProps> = memo(({
  uri,
  style,
  thumbnail,
  placeholder,
  onLoad,
  onError,
  resizeMode = 'cover'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  // Reset states when URI changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setShowFullImage(false);
  }, [uri]);

  const handleThumbnailLoad = () => {
    setIsLoading(false);
  };

  const handleFullImageLoad = () => {
    setShowFullImage(true);
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = (error: any) => {
    logger.error('Image load error:', error);
    setHasError(true);
    setIsLoading(false);
    onError?.(error);
  };

  if (hasError) {
    return (
      <View style={[styles.container, style, styles.errorContainer]}>
        {placeholder || (
          <View style={styles.placeholderContent}>
            <ActivityIndicator size="small" color={COLORS.textSecondary} />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Thumbnail for progressive loading */}
      {thumbnail && !showFullImage && (
        <Image
          source={{ uri: thumbnail }}
          style={[StyleSheet.absoluteFillObject, { opacity: isLoading ? 0 : 1 }]}
          onLoad={handleThumbnailLoad}
          onError={handleError}
          resizeMode={resizeMode}
          blurRadius={2} // Slight blur for thumbnail
        />
      )}

      {/* Full resolution image */}
      <Image
        source={{ uri }}
        style={[
          StyleSheet.absoluteFillObject,
          { opacity: showFullImage ? 1 : 0 }
        ]}
        onLoad={handleFullImageLoad}
        onError={handleError}
        resizeMode={resizeMode}
      />

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  errorContainer: {
    backgroundColor: COLORS.background,
  },
  placeholderContent: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;