import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, FIBONACCI, TYPOGRAPHY, ELEMENT_SIZES } from '../constants';
import { useRTL } from '../utils/rtl';

interface Alternative {
  plant_id: string;
  confidence: number;
  plant_name: string;
}

interface PartialMatchCardProps {
  genusName: string;
  alternatives?: Alternative[];
  onAlternativePress?: (plantId: string) => void;
}

export default function PartialMatchCard({
  genusName,
  alternatives,
  onAlternativePress,
}: PartialMatchCardProps) {
  const { t } = useTranslation();
  const isRTL = useRTL();

  // Don't render if no alternatives
  if (!alternatives || alternatives.length === 0) {
    return null;
  }

  // Limit to top 5 alternatives
  const displayedAlternatives = alternatives.slice(0, 5);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="information-circle" size={FIBONACCI.LG} color={COLORS.primary} />
        <Text style={[styles.title, isRTL && styles.titleRTL]}>
          {t('plantRequest.alternatives.title', {
            count: alternatives.length,
            genus: genusName,
          })}
        </Text>
      </View>

      {/* Subtitle */}
      <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>
        {t('plantRequest.alternatives.subtitle')}
      </Text>

      {/* Alternatives List */}
      <View style={styles.listContainer}>
        {displayedAlternatives.map((alternative, index) => (
          <TouchableOpacity
            key={alternative.plant_id}
            style={styles.alternativeRow}
            onPress={() => onAlternativePress?.(alternative.plant_id)}
            activeOpacity={0.7}
          >
            <View style={styles.alternativeContent}>
              <View style={styles.bulletContainer}>
                <View style={styles.bullet} />
              </View>
              <Text style={[styles.alternativeName, isRTL && styles.alternativeNameRTL]} numberOfLines={1}>
                {alternative.plant_name}
              </Text>
            </View>
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>{alternative.confidence}%</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.lightGray, // #F5F5F5
    borderRadius: ELEMENT_SIZES.RADIUS_MD, // 13px
    padding: FIBONACCI.LG, // 21px
    marginTop: FIBONACCI.MD, // 13px
    marginBottom: FIBONACCI.MD, // 13px
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: FIBONACCI.SM, // 8px
    gap: FIBONACCI.SM, // 8px
  },
  title: {
    flex: 1,
    fontSize: TYPOGRAPHY.MD, // 18px
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'left',
  },
  titleRTL: {
    textAlign: 'right',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.SM, // 14px
    color: COLORS.textSecondary,
    marginBottom: FIBONACCI.MD, // 13px
    textAlign: 'left',
  },
  subtitleRTL: {
    textAlign: 'right',
  },
  listContainer: {
    gap: FIBONACCI.SM, // 8px between items
  },
  alternativeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingVertical: FIBONACCI.MD, // 13px
    paddingHorizontal: FIBONACCI.MD, // 13px
    borderRadius: ELEMENT_SIZES.RADIUS_SM, // 8px
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  alternativeContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: FIBONACCI.SM, // 8px
  },
  bulletContainer: {
    width: FIBONACCI.MD, // 13px
    alignItems: 'center',
  },
  bullet: {
    width: FIBONACCI.XXS, // 3px
    height: FIBONACCI.XXS, // 3px
    borderRadius: FIBONACCI.XXS / 2, // Circular
    backgroundColor: COLORS.primary,
  },
  alternativeName: {
    flex: 1,
    fontSize: TYPOGRAPHY.BASE, // 16px
    color: COLORS.text,
    textAlign: 'left',
  },
  alternativeNameRTL: {
    textAlign: 'right',
  },
  confidenceBadge: {
    backgroundColor: COLORS.background, // #F7F3E9 (Cairo Sand)
    paddingHorizontal: FIBONACCI.SM, // 8px
    paddingVertical: FIBONACCI.XXS, // 3px
    borderRadius: ELEMENT_SIZES.RADIUS_SM, // 8px
    marginLeft: FIBONACCI.SM, // 8px
  },
  confidenceText: {
    fontSize: TYPOGRAPHY.SM, // 14px
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
