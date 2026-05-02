import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { COLORS, FIBONACCI, TYPOGRAPHY, ELEMENT_SIZES } from '../constants';
import { Plant } from '../types';
import PlantImage from './PlantImage';
import PressSpring from './PressSpring';
import { useRTL } from '../utils/rtl';
import { getCurrentLanguage } from '../i18n';

interface PlantCardProps {
  plant: Plant;
  onPress: () => void;
  imageUrl?: string;
}

export default function PlantCard({ plant, onPress, imageUrl }: PlantCardProps) {
  const isRTL = useRTL();
  const currentLang = getCurrentLanguage(); // 🌐 FIX: Get language for localization

  // 🌐 FIX: Use Arabic name when language is Arabic
  const commonName = currentLang === 'ar' && plant.names?.arabic?.length > 0
    ? plant.names.arabic[0]
    : (plant.names.common[0] || 'Unknown Plant');

  const scientificName = plant.names.scientific[0] || '';

  // Use image from plant database or provided imageUrl
  const plantImageUrl = (plant as any).image_url || imageUrl;

  // For Taxonomic styling
  const scientificNameParts = scientificName.split(' ');
  const genus = scientificNameParts[0] || '';
  const species = scientificNameParts.slice(1).join(' ');

  return (
    <PressSpring
      style={styles.container}
      onPress={onPress}
      pressedScale={0.97}
    >
      {/* Plant Image */}
      <View style={styles.imageContainer}>
        <PlantImage
          capturedImageUri={plant.captured_image_uri}
          plantId={plant.plant_id || plant.species_id || plant.id}
          imageUrl={plantImageUrl}
          plantName={commonName}
          size={ELEMENT_SIZES.AVATAR_MD}
          style={styles.image}
        />
      </View>

      {/* Plant Info */}
      <View style={styles.infoContainer}>
        <Text style={[styles.commonName, isRTL && styles.commonNameRTL]}>
          {commonName}
        </Text>
        <Text style={[styles.scientificNameBase, isRTL && styles.scientificNameRTL]} numberOfLines={1}>
          <Text style={styles.genusName}>{genus} </Text>
          <Text style={styles.speciesName}>{species}</Text>
        </Text>
      </View>
    </PressSpring>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 120, // Fixed height for all cards
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
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
    borderRadius: ELEMENT_SIZES.RADIUS_MD, // Match container radius
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center', // Vertically center the text block
    height: '100%', // Ensure it takes full height to allow centering
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
  scientificNameBase: {
    fontSize: TYPOGRAPHY.SM, // 14px
    color: COLORS.textSecondary,
  },
  genusName: {
    fontWeight: '700', // Bold
  },
  speciesName: {
    fontStyle: 'italic', // Italic
  },
  scientificNameRTL: {
    textAlign: 'right',
  },
});
