/**
 * GardenLocationModal
 *
 * Shown when the user adds their 3rd plant to the garden.
 * Prompts to save current location as "My Garden" for consistent weather data.
 * Follows the same design pattern as FeedbackModal/NameCollectionModal.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import PressSpring from './PressSpring';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, FIBONACCI, TYPOGRAPHY } from '../constants';
import { useRTL } from '../utils/rtl';
import { getNativeWeather } from '../../modules/lotus-weather';
import { logger } from '../utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GardenLocationModalProps {
  visible: boolean;
  onSave: (location: { lat: number; lon: number; name: string }) => void;
  onSkip: () => void;
}

export default function GardenLocationModal({
  visible,
  onSave,
  onSkip,
}: GardenLocationModalProps) {
  const { t } = useTranslation();
  const isRTL = useRTL();
  const [locationName, setLocationName] = useState<string | null>(null);
  const [locationData, setLocationData] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchLocation();
    }
  }, [visible]);

  const fetchLocation = async () => {
    setIsLoading(true);
    try {
      const result = await getNativeWeather();
      setLocationName(result.locationName);
      setLocationData({
        lat: result.latitude,
        lon: result.longitude,
        name: result.locationName,
      });
    } catch (error) {
      logger.error('Failed to fetch location for garden:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!locationData) return;
    setIsSaving(true);
    try {
      onSave(locationData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onSkip}
    >
      <View style={styles.modalContainer}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        >
          <View style={styles.contentContainer}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="location-outline" size={48} color={COLORS.white} />
            </View>

            {/* Title */}
            <Text style={styles.title}>
              {t('gardenLocation.promptTitle')}
            </Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              {t('gardenLocation.promptSubtitle')}
            </Text>

            {/* Location Display */}
            {isLoading ? (
              <View style={styles.locationPill}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : locationName ? (
              <View style={styles.locationPill}>
                <Ionicons name="location" size={18} color={COLORS.primary} />
                <Text style={styles.locationText}>{locationName}</Text>
              </View>
            ) : null}

            {/* Save Button */}
            <PressSpring
              style={[styles.saveButton, (isLoading || isSaving) && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isLoading || isSaving || !locationData}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <Ionicons name="home-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.saveButtonText}>
                    {t('gardenLocation.save')}
                  </Text>
                </>
              )}
            </PressSpring>

            {/* Skip Link */}
            <PressSpring
              style={styles.skipButton}
              onPress={onSkip}
              pressedScale={0.98}
            >
              <Text style={styles.skipButtonText}>
                {t('gardenLocation.notNow')}
              </Text>
            </PressSpring>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  gradientBackground: {
    width: SCREEN_WIDTH * 0.85,
    borderRadius: 20,
    padding: FIBONACCI.LG,
    alignItems: 'center',
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: FIBONACCI.MD,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: FIBONACCI.LG,
  },
  title: {
    fontSize: TYPOGRAPHY.LG,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: FIBONACCI.LG,
    opacity: 0.9,
    paddingHorizontal: FIBONACCI.SM,
    lineHeight: 20,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: FIBONACCI.LG,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  saveButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: FIBONACCI.MD,
    paddingVertical: 8,
  },
  skipButtonText: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.8,
  },
});
