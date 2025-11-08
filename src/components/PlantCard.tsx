import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { COLORS, FIBONACCI, TYPOGRAPHY, ELEMENT_SIZES } from '../constants';
import { Plant } from '../types';
import PlantImage from './PlantImage';
import { useRTL } from '../utils/rtl';

interface PlantCardProps {
  plant: Plant;
  onPress: () => void;
  imageUrl?: string;
}

export default function PlantCard({ plant, onPress, imageUrl }: PlantCardProps) {
  const isRTL = useRTL();

  // Get the first common name and scientific name
  const commonName = plant.names.common[0] || 'Unknown Plant';
  const scientificName = plant.names.scientific[0] || '';

  // Use image from plant database or provided imageUrl
  const plantImageUrl = (plant as any).image_url || imageUrl;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Plant Image - Circular with Smart Fallback */}
      <View style={styles.imageContainer}>
        <PlantImage
          imageUrl={plantImageUrl}
          plantName={commonName}
          size={ELEMENT_SIZES.AVATAR_MD}
          style={styles.image}
        />
      </View>

      {/* Plant Info */}
      <View style={styles.infoContainer}>
        <Text style={[styles.commonName, isRTL && styles.commonNameRTL]} numberOfLines={1}>
          {commonName}
        </Text>
        <Text style={[styles.scientificName, isRTL && styles.scientificNameRTL]} numberOfLines={1}>
          {scientificName}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: FIBONACCI.MD,
    paddingHorizontal: FIBONACCI.LG,
    marginBottom: FIBONACCI.MD,
    borderRadius: ELEMENT_SIZES.RADIUS_MD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    width: ELEMENT_SIZES.AVATAR_MD, // 89px
    height: ELEMENT_SIZES.AVATAR_MD,
    marginRight: FIBONACCI.LG,
  },
  image: {
    borderRadius: ELEMENT_SIZES.AVATAR_MD / 2, // Circular
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  commonName: {
    fontSize: TYPOGRAPHY.LG, // 21px
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: FIBONACCI.XXS, // 3px
  },
  commonNameRTL: {
    textAlign: 'right',
  },
  scientificName: {
    fontSize: TYPOGRAPHY.SM, // 14px
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  scientificNameRTL: {
    textAlign: 'right',
  },
});
