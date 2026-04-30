/**
 * TagInfoModal
 *
 * Tap-to-learn bottom sheet for trait tag pills.
 * Shows educational info about light levels and pet safety.
 * Matches the app's existing modal design language.
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, FIBONACCI, TYPOGRAPHY } from '../constants';
import { useRTL } from '../utils/rtl';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Light level config ──────────────────────────────────────
export type LightLevel =
  | 'bright_direct'
  | 'bright_indirect'
  | 'medium_indirect'
  | 'medium_light'
  | 'low_to_medium'
  | 'low_light';

const LIGHT_LEVELS: {
  key: LightLevel;
  icon: keyof typeof Ionicons.glyphMap;
  bars: number;          // 1-4 brightness meter
  color: string;
}[] = [
  { key: 'bright_direct',   icon: 'sunny',        bars: 4, color: '#F59E0B' },
  { key: 'bright_indirect', icon: 'partly-sunny',  bars: 3, color: '#FBBF24' },
  { key: 'medium_indirect', icon: 'cloudy',        bars: 2, color: '#9CA3AF' },
  { key: 'medium_light',    icon: 'cloudy',        bars: 2, color: '#9CA3AF' },
  { key: 'low_to_medium',   icon: 'cloudy-night',  bars: 2, color: '#6B7280' },
  { key: 'low_light',       icon: 'moon',          bars: 1, color: '#6B7280' },
];

// ── Helper: get icon for a light key ────────────────────────
export function getLightIcon(key: string): keyof typeof Ionicons.glyphMap {
  return LIGHT_LEVELS.find(l => l.key === key)?.icon ?? 'sunny-outline';
}

export function getLightColor(key: string): string {
  return LIGHT_LEVELS.find(l => l.key === key)?.color ?? '#9CA3AF';
}

// ── Props ───────────────────────────────────────────────────
export type TagInfoType = 'light' | 'petSafe' | 'petToxic';

interface TagInfoModalProps {
  visible: boolean;
  type: TagInfoType;
  activeLightKey?: string;   // which light level to highlight
  onClose: () => void;
}

// ── Brightness meter bar ────────────────────────────────────
function BrightnessMeter({ filled, total = 4 }: { filled: number; total?: number }) {
  return (
    <View style={meterStyles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            meterStyles.bar,
            i < filled ? meterStyles.barFilled : meterStyles.barEmpty,
          ]}
        />
      ))}
    </View>
  );
}

const meterStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
  },
  bar: {
    width: 6,
    height: 14,
    borderRadius: 2,
  },
  barFilled: {
    backgroundColor: COLORS.primary,
  },
  barEmpty: {
    backgroundColor: '#E5E7EB',
  },
});

// ── Component ───────────────────────────────────────────────
export default function TagInfoModal({
  visible,
  type,
  activeLightKey,
  onClose,
}: TagInfoModalProps) {
  const { t } = useTranslation();
  const isRTL = useRTL();

  const renderLightContent = () => (
    <View style={styles.contentWrap}>
      {/* Header */}
      <View style={[styles.headerRow, isRTL && styles.headerRowRTL]}>
        <Ionicons name="sunny" size={28} color="#F59E0B" />
        <Text style={[styles.title, isRTL && styles.titleRTL]}>
          {t('tagInfo.lightTitle')}
        </Text>
      </View>

      <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>
        {t('tagInfo.lightSubtitle')}
      </Text>

      {/* Light level rows */}
      {LIGHT_LEVELS.filter(l =>
        // Only show the 4 main levels (skip duplicates)
        ['bright_direct', 'bright_indirect', 'medium_indirect', 'low_light'].includes(l.key)
      ).map((level) => {
        const isActive = level.key === activeLightKey ||
          (activeLightKey === 'medium_light' && level.key === 'medium_indirect') ||
          (activeLightKey === 'low_to_medium' && level.key === 'low_light');

        return (
          <View
            key={level.key}
            style={[
              styles.lightRow,
              isRTL && styles.lightRowRTL,
              isActive && styles.lightRowActive,
            ]}
          >
            <View style={[styles.lightRowLeft, isRTL && styles.lightRowLeftRTL]}>
              <Ionicons name={level.icon} size={22} color={level.color} />
              <View style={styles.lightTextWrap}>
                <Text style={[styles.lightName, isRTL && styles.lightNameRTL, isActive && styles.lightNameActive]}>
                  {t(`tags.${level.key}`)}
                </Text>
                <Text style={[styles.lightDesc, isRTL && styles.lightDescRTL]}>
                  {t(`tagInfo.light_${level.key}_desc`)}
                </Text>
              </View>
            </View>
            <BrightnessMeter filled={level.bars} />
          </View>
        );
      })}

      {/* Pro tip */}
      <View style={[styles.proTipRow, isRTL && styles.proTipRowRTL]}>
        <Ionicons name="bulb-outline" size={18} color={COLORS.primary} />
        <Text style={[styles.proTipText, isRTL && styles.proTipTextRTL]}>
          {t('tagInfo.lightProTip')}
        </Text>
      </View>
    </View>
  );

  const renderPetContent = () => {
    const isPetSafe = type === 'petSafe';
    return (
      <View style={styles.contentWrap}>
        {/* Header */}
        <View style={[styles.headerRow, isRTL && styles.headerRowRTL]}>
          <Text style={styles.headerEmoji}>{isPetSafe ? '🐶' : '🚫'}</Text>
          <Text style={[styles.title, isRTL && styles.titleRTL]}>
            {isPetSafe ? t('tagInfo.petSafeTitle') : t('tagInfo.petToxicTitle')}
          </Text>
        </View>

        {/* Main message */}
        <View style={[
          styles.petMessageBox,
          isPetSafe ? styles.petSafeBox : styles.petToxicBox,
        ]}>
          <Text style={[
            styles.petMessageText,
            isPetSafe ? styles.petSafeText : styles.petToxicText,
            isRTL && styles.petMessageTextRTL,
          ]}>
            {isPetSafe ? t('tagInfo.petSafeMessage') : t('tagInfo.petToxicMessage')}
          </Text>
        </View>

        {/* Extra note */}
        <Text style={[styles.petNote, isRTL && styles.petNoteRTL]}>
          {isPetSafe ? t('tagInfo.petSafeNote') : t('tagInfo.petToxicNote')}
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          {/* Drag handle */}
          <View style={styles.handleBar} />

          {type === 'light' ? renderLightContent() : renderPetContent()}

          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>{t('tagInfo.gotIt')}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: FIBONACCI.SM,
    paddingBottom: FIBONACCI.XL,
    paddingHorizontal: FIBONACCI.LG,
    maxHeight: '80%',
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: FIBONACCI.MD,
  },
  contentWrap: {
    paddingBottom: FIBONACCI.MD,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: FIBONACCI.SM,
    marginBottom: FIBONACCI.XS,
  },
  headerRowRTL: {
    flexDirection: 'row-reverse',
  },
  headerEmoji: {
    fontSize: 28,
  },
  title: {
    fontSize: TYPOGRAPHY.XL,
    fontWeight: '700',
    color: COLORS.text,
  },
  titleRTL: {
    textAlign: 'right',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.textSecondary,
    marginBottom: FIBONACCI.MD,
    lineHeight: 20,
  },
  subtitleRTL: {
    textAlign: 'right',
  },

  // Light rows
  lightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: FIBONACCI.SM + 2,
    paddingHorizontal: FIBONACCI.SM,
    borderRadius: 12,
    marginBottom: FIBONACCI.XS,
  },
  lightRowRTL: {
    flexDirection: 'row-reverse',
  },
  lightRowActive: {
    backgroundColor: '#F0FFF4',
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  lightRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: FIBONACCI.SM,
    flex: 1,
  },
  lightRowLeftRTL: {
    flexDirection: 'row-reverse',
  },
  lightTextWrap: {
    flex: 1,
  },
  lightName: {
    fontSize: TYPOGRAPHY.BASE,
    fontWeight: '600',
    color: COLORS.text,
  },
  lightNameRTL: {
    textAlign: 'right',
  },
  lightNameActive: {
    color: COLORS.primary,
  },
  lightDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  lightDescRTL: {
    textAlign: 'right',
  },

  // Pro tip
  proTipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: FIBONACCI.XS,
    marginTop: FIBONACCI.MD,
    backgroundColor: '#F7F3E9',
    padding: FIBONACCI.SM + 2,
    borderRadius: 10,
  },
  proTipRowRTL: {
    flexDirection: 'row-reverse',
  },
  proTipText: {
    fontSize: 12,
    color: COLORS.text,
    flex: 1,
    lineHeight: 18,
  },
  proTipTextRTL: {
    textAlign: 'right',
  },

  // Pet safety
  petMessageBox: {
    padding: FIBONACCI.MD,
    borderRadius: 12,
    marginTop: FIBONACCI.SM,
    marginBottom: FIBONACCI.SM,
  },
  petSafeBox: {
    backgroundColor: '#F0FFF4',
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  petToxicBox: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  petMessageText: {
    fontSize: TYPOGRAPHY.BASE,
    fontWeight: '600',
    lineHeight: 22,
  },
  petSafeText: {
    color: '#276749',
  },
  petToxicText: {
    color: '#C53030',
  },
  petMessageTextRTL: {
    textAlign: 'right',
  },
  petNote: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  petNoteRTL: {
    textAlign: 'right',
  },

  // Close button
  closeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: FIBONACCI.MD,
    alignItems: 'center',
    marginTop: FIBONACCI.SM,
  },
  closeButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.BASE,
    fontWeight: '600',
  },
});
