import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, FIBONACCI, TYPOGRAPHY, ELEMENT_SIZES } from '../constants';
import { useRTL } from '../utils/rtl';
import { WeatherData } from '../types';

interface WeatherTrackerModalProps {
  visible: boolean;
  onClose: () => void;
  weather: WeatherData | null;
}

const getWeatherEmoji = (condition: string) => {
  const hour = new Date().getHours();
  const isNight = hour >= 19 || hour < 6;
  if (isNight) {
    if (condition === 'cloudy') return '🌥️';
    if (condition === 'rainy') return '🌧️';
    return '🌖';
  }
  if (condition === 'sunny') return '☀️';
  if (condition === 'cloudy') return '☁️';
  if (condition === 'rainy') return '🌧️';
  return '🌤️';
};

const getUVLabel = (uvCategory?: string, isRTL?: boolean) => {
  const labels: Record<string, { en: string; ar: string }> = {
    low: { en: 'Low', ar: 'منخفض' },
    moderate: { en: 'Moderate', ar: 'متوسط' },
    high: { en: 'High', ar: 'عالي' },
    veryHigh: { en: 'Very High', ar: 'عالي جداً' },
    extreme: { en: 'Extreme', ar: 'شديد' },
  };
  const key = uvCategory?.toLowerCase() || 'low';
  const label = labels[key] || labels.low;
  return isRTL ? label.ar : label.en;
};

export default function WeatherTrackerModal({
  visible,
  onClose,
  weather,
}: WeatherTrackerModalProps) {
  const { t } = useTranslation();
  const isRTL = useRTL();

  if (!weather) return null;

  const windSpeedKmh = weather.windSpeed;
  const windGustKmh = weather.windGust || 0;
  const pressureMmHg = weather.pressure ? Math.round(weather.pressure * 0.750062) : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, isRTL && styles.headerRTL]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('weather.tracker.title')}
          </Text>
          <View style={styles.closeButton} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Large Weather Display */}
          <View style={styles.heroSection}>
            <Text style={styles.heroEmoji}>{getWeatherEmoji(weather.condition)}</Text>
            <Text style={styles.heroTemp}>{weather.temperature}°C</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color={COLORS.primary} />
              <Text style={styles.locationText}>{weather.location}</Text>
            </View>
            <Text style={styles.minMaxText}>
              {t('weather.tracker.minMax', { min: weather.tempMin ?? '--', max: weather.tempMax ?? '--' })}
            </Text>
          </View>

          {/* Weather Details Grid (2x2) */}
          <View style={styles.gridContainer}>
            {/* Row 1: UV Index + Wind */}
            <View style={[styles.gridRow, isRTL && styles.gridRowRTL]}>
              {/* UV Index */}
              <View style={styles.gridCard}>
                <View style={[styles.gridCardHeader, isRTL && styles.gridCardHeaderRTL]}>
                  <Ionicons name="sunny-outline" size={18} color={COLORS.secondary} />
                  <Text style={styles.gridCardLabel}>
                    {t('weather.tracker.uvIndex')}
                  </Text>
                </View>
                <Text style={styles.gridCardValue}>
                  {weather.uvIndex ?? '--'}
                </Text>
                <Text style={styles.gridCardSub}>
                  {getUVLabel(weather.uvCategory, isRTL)}
                </Text>
              </View>

              {/* Wind */}
              <View style={styles.gridCard}>
                <View style={[styles.gridCardHeader, isRTL && styles.gridCardHeaderRTL]}>
                  <Ionicons name="flag-outline" size={18} color={COLORS.secondary} />
                  <Text style={styles.gridCardLabel}>
                    {t('weather.tracker.wind')}
                  </Text>
                </View>
                <Text style={styles.gridCardValue}>
                  {Math.round(windSpeedKmh)} {t('weather.tracker.kmh')}
                </Text>
                {windGustKmh > 0 && (
                  <Text style={styles.gridCardSub}>
                    {t('weather.tracker.gusts', { value: Math.round(windGustKmh) })}
                  </Text>
                )}
              </View>
            </View>

            {/* Row 2: Humidity + Pressure */}
            <View style={[styles.gridRow, isRTL && styles.gridRowRTL]}>
              {/* Humidity */}
              <View style={styles.gridCard}>
                <View style={[styles.gridCardHeader, isRTL && styles.gridCardHeaderRTL]}>
                  <Ionicons name="water-outline" size={18} color={COLORS.secondary} />
                  <Text style={styles.gridCardLabel}>
                    {t('weather.tracker.humidity')}
                  </Text>
                </View>
                <Text style={styles.gridCardValue}>
                  {weather.humidity} %
                </Text>
              </View>

              {/* Pressure */}
              <View style={styles.gridCard}>
                <View style={[styles.gridCardHeader, isRTL && styles.gridCardHeaderRTL]}>
                  <Ionicons name="speedometer-outline" size={18} color={COLORS.secondary} />
                  <Text style={styles.gridCardLabel}>
                    {t('weather.tracker.pressure')}
                  </Text>
                </View>
                <Text style={styles.gridCardValue}>
                  {weather.pressure ?? '--'} mb
                </Text>
                {pressureMmHg && (
                  <Text style={styles.gridCardSub}>
                    {pressureMmHg} mmHg
                  </Text>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: FIBONACCI.MD,
    paddingVertical: FIBONACCI.SM,
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: TYPOGRAPHY.LG,
    color: COLORS.text,
  },

  content: {
    paddingHorizontal: FIBONACCI.MD,
    paddingBottom: FIBONACCI.XXL,
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    paddingVertical: FIBONACCI.XL,
  },
  heroEmoji: {
    fontSize: 80,
    marginBottom: FIBONACCI.MD,
  },
  heroTemp: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 64,
    color: COLORS.text,
    marginBottom: FIBONACCI.XS,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: FIBONACCI.XS,
    marginBottom: FIBONACCI.XS,
  },
  locationText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: TYPOGRAPHY.MD,
    color: COLORS.primary,
  },
  minMaxText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.textSecondary,
  },

  // Grid
  gridContainer: {
    marginTop: FIBONACCI.LG,
  },
  gridRow: {
    flexDirection: 'row',
    gap: FIBONACCI.MD,
    marginBottom: FIBONACCI.MD,
  },
  gridRowRTL: {
    flexDirection: 'row-reverse',
  },
  gridCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: ELEMENT_SIZES.RADIUS_LG,
    padding: FIBONACCI.LG,
    minHeight: 120,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  gridCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: FIBONACCI.XS,
    marginBottom: FIBONACCI.MD,
  },
  gridCardHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  gridCardLabel: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.text,
  },
  gridCardValue: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: TYPOGRAPHY.XL,
    color: COLORS.primary,
    marginBottom: FIBONACCI.XXS,
  },
  gridCardSub: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: TYPOGRAPHY.XS,
    color: COLORS.textSecondary,
  },
});
