import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FIBONACCI, TYPOGRAPHY, ELEMENT_SIZES } from '../constants';
import { useRTL } from '../utils/rtl';

interface GenericCareCardProps {
  plantFamily?: string;
  scientificName?: string;
}

type PlantType = 'succulent' | 'tropical' | 'general';

export default function GenericCareCard({ plantFamily, scientificName }: GenericCareCardProps) {
  const { t } = useTranslation();
  const isRTL = useRTL();

  // Infer plant type from scientific name or family
  const plantType = useMemo((): PlantType => {
    const name = (scientificName || '').toLowerCase();
    const family = (plantFamily || '').toLowerCase();

    // Succulent detection
    if (
      name.includes('euphorbia') ||
      name.includes('aloe') ||
      name.includes('cactus') ||
      name.includes('echeveria') ||
      name.includes('sedum') ||
      name.includes('crassula') ||
      family.includes('cactaceae') ||
      family.includes('crassulaceae') ||
      family.includes('aizoaceae')
    ) {
      return 'succulent';
    }

    // Tropical detection
    if (
      name.includes('monstera') ||
      name.includes('philodendron') ||
      name.includes('pothos') ||
      name.includes('epipremnum') ||
      name.includes('anthurium') ||
      name.includes('alocasia') ||
      name.includes('calathea') ||
      family.includes('araceae') ||
      family.includes('marantaceae')
    ) {
      return 'tropical';
    }

    return 'general';
  }, [scientificName, plantFamily]);

  // Get care tips based on plant type
  const careTips = useMemo(() => {
    switch (plantType) {
      case 'succulent':
        return [
          { emoji: '💧', text: t('plantRequest.genericCare.wateringSucculent') },
          { emoji: '☀️', text: t('plantRequest.genericCare.lightSucculent') },
          { emoji: '🏜️', text: t('plantRequest.genericCare.cairoSucculent') },
          { emoji: '🪴', text: t('plantRequest.genericCare.soil') },
        ];
      case 'tropical':
        return [
          { emoji: '💧', text: t('plantRequest.genericCare.wateringTropical') },
          { emoji: '☀️', text: t('plantRequest.genericCare.lightTropical') },
          { emoji: '💦', text: t('plantRequest.genericCare.cairoTropical') },
          { emoji: '🪴', text: t('plantRequest.genericCare.soil') },
        ];
      default: // general
        return [
          { emoji: '💧', text: t('plantRequest.genericCare.wateringGeneral') },
          { emoji: '☀️', text: t('plantRequest.genericCare.lightGeneral') },
          { emoji: '🌡️', text: t('plantRequest.genericCare.cairoTip') },
          { emoji: '💨', text: t('plantRequest.genericCare.airflow') },
          { emoji: '🪴', text: t('plantRequest.genericCare.soil') },
        ];
    }
  }, [plantType, t]);

  return (
    <View style={styles.container}>
      {/* Warning Banner */}
      <View style={styles.warningBanner}>
        <Text style={[styles.warningText, isRTL && styles.warningTextRTL]}>
          ⚠️ {t('plantRequest.genericCare.warning')}
        </Text>
      </View>

      {/* Title */}
      <Text style={[styles.title, isRTL && styles.titleRTL]}>
        {t('plantRequest.genericCare.title')}
      </Text>

      {/* Care Tips */}
      <View style={styles.tipsContainer}>
        {careTips.map((tip, index) => (
          <View key={index} style={styles.tipRow}>
            <Text style={styles.emoji}>{tip.emoji}</Text>
            <Text style={[styles.tipText, isRTL && styles.tipTextRTL]}>
              {tip.text}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: ELEMENT_SIZES.RADIUS_MD, // 13px
    padding: FIBONACCI.LG, // 21px
    marginVertical: FIBONACCI.MD, // 13px
  },
  warningBanner: {
    backgroundColor: 'rgba(255, 173, 20, 0.1)', // Warning tint (FAAD14 with alpha)
    borderRadius: ELEMENT_SIZES.RADIUS_SM, // 8px
    padding: FIBONACCI.MD, // 13px
    marginBottom: FIBONACCI.LG, // 21px
  },
  warningText: {
    fontSize: TYPOGRAPHY.SM, // 14px
    color: COLORS.warning, // #FAAD14
    fontStyle: 'italic',
    textAlign: 'left',
  },
  warningTextRTL: {
    textAlign: 'right',
  },
  title: {
    fontSize: TYPOGRAPHY.LG, // 21px
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: FIBONACCI.MD, // 13px
    textAlign: 'left',
  },
  titleRTL: {
    textAlign: 'right',
  },
  tipsContainer: {
    gap: FIBONACCI.MD, // 13px between tips
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  emoji: {
    fontSize: FIBONACCI.LG, // 21px
    marginRight: FIBONACCI.MD, // 13px
    width: FIBONACCI.XL, // 34px fixed width for alignment
  },
  tipText: {
    flex: 1,
    fontSize: TYPOGRAPHY.BASE, // 16px
    color: COLORS.text,
    lineHeight: TYPOGRAPHY.BASE * 1.5, // 24px
    textAlign: 'left',
  },
  tipTextRTL: {
    textAlign: 'right',
  },
});
