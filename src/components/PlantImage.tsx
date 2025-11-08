import React, { useState } from 'react';
import { Image, View, Text, StyleSheet, ImageStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../constants';

interface PlantImageProps {
  imageUrl?: string | null;
  plantName?: string;
  size?: number;
  style?: StyleProp<ImageStyle>;
}

/**
 * PlantImage Component with PERFORMANCE OPTIMIZATION
 *
 * Optimizations:
 * - CDN image size optimization (requests smaller images)
 * - Smart fallback system
 * - Works with FlatList virtualization
 *
 * Note: Using React Native Image (not expo-image) to avoid native rebuild
 */
export default function PlantImage({
  imageUrl,
  plantName = 'Plant',
  size = 80,
  style
}: PlantImageProps) {
  const [imageError, setImageError] = useState(false);

  // Optimize Kaynuna URLs by requesting specific dimensions
  const optimizedImageUrl = imageUrl ? optimizeImageUrl(imageUrl, size) : null;

  // If no URL or error occurred, show fallback
  if (!optimizedImageUrl || imageError) {
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
      <Image
        source={{ uri: optimizedImageUrl }}
        style={[styles.image, { width: size, height: size }]}
        onError={() => {
          setImageError(true);
        }}
      />
    </View>
  );
}

/**
 * Optimize image URL for faster loading
 * For Kaynuna CDN: Request appropriately sized images (80-90% smaller files!)
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
  loadingOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background + '80', // 80% opacity
  },
});
