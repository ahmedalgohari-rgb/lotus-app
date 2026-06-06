/**
 * LightComparisonCard
 *
 * A compact, single-language card showing what a plant needs vs. what a
 * window gives, on a unified 4-tier light scale (Low / Medium / Bright
 * Indirect / Full Sun). Used in:
 *   - AddPlantScreen step 2 (compass)
 *   - PlantDetailScreen (saved plants)
 *
 * Intentionally tiny so the compass step fits on iPhone 13 mini without
 * scrolling.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { COLORS, FIBONACCI, TYPOGRAPHY } from '../constants';
import {
  LightTier,
  LIGHT_TIER_KEYS,
  plantNeedToTier,
  windowGivesToTier,
  getPlacementAdviceKey,
} from '../utils/care/lightScale';

interface Props {
  plantLightRequirement?: string;
  windowIntensity?: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
  directSunHours?: number;
  direction?: 'north' | 'east' | 'south' | 'west';
  season?: 'winter' | 'spring' | 'summer' | 'autumn';
  isRTL: boolean;
}

// Segmented dots: ●●●○ — `level` filled out of 4
function TierDots({ level }: { level: LightTier }) {
  return (
    <View style={styles.dotsRow}>
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={[styles.dot, i <= level ? styles.dotFilled : styles.dotEmpty]}
        />
      ))}
    </View>
  );
}

export default function LightComparisonCard({
  plantLightRequirement,
  windowIntensity,
  directSunHours = 0,
  direction,
  season,
  isRTL,
}: Props) {
  const { t } = useTranslation();

  if (!plantLightRequirement || !windowIntensity) return null;

  const plantTier = plantNeedToTier(plantLightRequirement);
  const windowTier = windowGivesToTier(windowIntensity, directSunHours);
  const matches = plantTier === windowTier;

  const adviceKey =
    direction && season
      ? getPlacementAdviceKey(direction, season, plantTier, windowTier)
      : null;

  return (
    <View style={styles.card}>
      <View style={[styles.row, isRTL && styles.rowRTL]}>
        <Text style={[styles.label, isRTL && styles.textRTL]}>
          {t('addPlant.lightComparison.plantNeeds')}
        </Text>
        <View style={styles.rightCol}>
          <TierDots level={plantTier} />
          <Text style={styles.tierLabel}>{t(`addPlant.${LIGHT_TIER_KEYS[plantTier]}`)}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={[styles.row, isRTL && styles.rowRTL]}>
        <Text style={[styles.label, isRTL && styles.textRTL]}>
          {t('addPlant.lightComparison.windowGives')}
        </Text>
        <View style={styles.rightCol}>
          <TierDots level={windowTier} />
          <Text
            style={[styles.tierLabel, matches && styles.tierLabelMatch]}
          >
            {t(`addPlant.${LIGHT_TIER_KEYS[windowTier]}`)}
            {matches ? '  ✓' : ''}
          </Text>
        </View>
      </View>

      {adviceKey && (
        <View style={[styles.adviceRow, isRTL && { flexDirection: 'row-reverse' }]}>
          <Ionicons
            name="resize-outline"
            size={14}
            color={COLORS.textSecondary}
            style={{ marginRight: 6, marginLeft: isRTL ? 6 : 0 }}
          />
          <Text style={[styles.advice, isRTL && styles.textRTL]}>
            {t(`addPlant.${adviceKey}`)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    borderRadius: FIBONACCI.SM,
    paddingVertical: FIBONACCI.SM,
    paddingHorizontal: FIBONACCI.MD,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.15)',
    marginBottom: FIBONACCI.SM,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  label: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.text,
    fontWeight: '500',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 3,
  },
  dotFilled: {
    backgroundColor: COLORS.primary,
  },
  dotEmpty: {
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  tierLabel: {
    fontSize: TYPOGRAPHY.XS,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tierLabelMatch: {
    color: COLORS.success ?? COLORS.primary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginVertical: 4,
  },
  adviceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  advice: {
    flex: 1,
    fontSize: TYPOGRAPHY.XS,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  textRTL: {
    textAlign: 'right',
  },
});
