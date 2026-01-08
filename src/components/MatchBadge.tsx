import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, FIBONACCI, TYPOGRAPHY, ELEMENT_SIZES } from '../constants';
import { useRTL } from '../utils/rtl';

interface MatchBadgeProps {
  matchType: 'full' | 'genus' | 'family' | 'none';
  confidence: number;
}

export default function MatchBadge({ matchType, confidence }: MatchBadgeProps) {
  const { t } = useTranslation();
  const isRTL = useRTL();

  // Configuration for each match type
  const config = {
    full: {
      backgroundColor: COLORS.success, // #52C41A green
      icon: 'checkmark-circle' as const,
      label: t('plantResult.matchTypes.full'),
      showConfidence: true,
    },
    genus: {
      backgroundColor: COLORS.warning, // #FAAD14 amber
      icon: 'information-circle' as const,
      label: t('plantResult.matchTypes.genus'),
      showConfidence: true,
    },
    family: {
      backgroundColor: '#FF7A00', // Orange
      icon: 'leaf-outline' as const,
      label: t('plantResult.matchTypes.family'),
      showConfidence: false,
    },
    none: {
      backgroundColor: COLORS.textSecondary, // Gray
      icon: 'sparkles' as const,
      label: t('plantResult.matchTypes.none'),
      showConfidence: false,
    },
  };

  const { backgroundColor, icon, label, showConfidence } = config[matchType];

  return (
    <View style={[styles.container, { backgroundColor }, isRTL ? styles.containerRTL : styles.containerLTR]}>
      <Ionicons name={icon} size={FIBONACCI.MD} color={COLORS.white} />
      {/* Only show label for non-full matches (genus, family, none) */}
      {matchType !== 'full' && (
        <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
          {label}
        </Text>
      )}
      {showConfidence && (
        <Text style={styles.confidence}>
          {confidence}%
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: FIBONACCI.SM, // 8px
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: FIBONACCI.MD, // 13px
    paddingVertical: FIBONACCI.SM, // 8px
    borderRadius: ELEMENT_SIZES.RADIUS_SM, // 8px
    gap: FIBONACCI.XXS, // 3px spacing between icon and text
    maxWidth: '70%', // Prevent overflow on small screens
  },
  containerLTR: {
    right: FIBONACCI.SM, // 8px from right
  },
  containerRTL: {
    left: FIBONACCI.SM, // 8px from left (for Arabic)
  },
  label: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.SM, // 14px
    fontWeight: '600',
    flexShrink: 1, // Allow text to shrink if needed
  },
  confidence: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.SM, // 14px
    fontWeight: '700',
    marginLeft: FIBONACCI.XXS, // 3px
  },
});
