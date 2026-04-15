/**
 * NotificationPromptModal
 *
 * Shown when the user adds their 1st plant to the garden.
 * Asks permission to send care reminder notifications.
 * Follows the same design pattern as FeedbackModal/NameCollectionModal.
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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, FIBONACCI, TYPOGRAPHY } from '../constants';
import { useRTL } from '../utils/rtl';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NotificationPromptModalProps {
  visible: boolean;
  onEnable: () => void;
  onSkip: () => void;
}

export default function NotificationPromptModal({
  visible,
  onEnable,
  onSkip,
}: NotificationPromptModalProps) {
  const { t } = useTranslation();
  const isRTL = useRTL();

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
              <Ionicons name="notifications-outline" size={48} color={COLORS.white} />
            </View>

            {/* Title */}
            <Text style={styles.title}>
              {t('notifications.promptTitle')}
            </Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              {t('notifications.promptSubtitle')}
            </Text>

            {/* Enable Button */}
            <TouchableOpacity
              style={styles.enableButton}
              onPress={onEnable}
              activeOpacity={0.8}
            >
              <Ionicons name="notifications" size={20} color={COLORS.primary} />
              <Text style={styles.enableButtonText}>
                {t('notifications.enable')}
              </Text>
            </TouchableOpacity>

            {/* Skip Link */}
            <TouchableOpacity
              style={styles.skipButton}
              onPress={onSkip}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>
                {t('notifications.skip')}
              </Text>
            </TouchableOpacity>
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
  enableButton: {
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
  enableButtonText: {
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
