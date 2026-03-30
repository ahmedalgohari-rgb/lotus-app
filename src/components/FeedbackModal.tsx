/**
 * FeedbackModal Component
 *
 * In-app feedback form that allows users to send feedback/comments.
 * Styled to match the NameCollectionModal with gradient background.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, FIBONACCI, TYPOGRAPHY } from '../constants';
import { useRTL } from '../utils/rtl';
import { useStore } from '../store';
import { supabase } from '../services/supabase';
import { logger } from '../utils/logger';
import Constants from 'expo-constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ visible, onClose }: FeedbackModalProps) {
  const { t } = useTranslation();
  const isRTL = useRTL();
  const { user } = useStore();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert(
        t('feedback.error'),
        t('feedback.emptyMessage')
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('feedback').insert({
        user_id: user?.id || null,
        user_email: user?.email || null,
        user_name: user?.user_metadata?.display_name || null,
        message: message.trim(),
        app_version: Constants.expoConfig?.version || 'unknown',
        device_info: `${Platform.OS} ${Platform.Version}`,
      });

      if (error) {
        throw error;
      }

      // Success
      Alert.alert(
        t('feedback.thankYouTitle'),
        t('feedback.thankYouMessage'),
        [{ text: t('common.ok'), onPress: handleClose }]
      );
      setMessage('');
    } catch (error) {
      logger.error('Failed to submit feedback:', error);
      Alert.alert(
        t('common.error'),
        t('feedback.submitError')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        >
          {/* Close button */}
          <TouchableOpacity
            onPress={handleClose}
            style={[styles.closeButton, isRTL && styles.closeButtonRTL]}
            disabled={isSubmitting}
          >
            <Ionicons name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>

          <View style={styles.contentContainer}>
            {/* Title */}
            <Text style={styles.title}>
              {t('feedback.title')}
            </Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              {t('feedback.subtitle')}
            </Text>

            {/* Text Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.textInput,
                  isRTL && styles.textInputRTL,
                ]}
                placeholder={t('feedback.placeholder')}
                placeholderTextColor={COLORS.textSecondary}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={5}
                maxLength={1000}
                textAlignVertical="top"
                textAlign={isRTL ? 'right' : 'left'}
                editable={!isSubmitting}
              />
              <Text style={[styles.charCount, isRTL && styles.charCountRTL]}>
                {message.length}/1000
              </Text>
            </View>

            {/* Buttons */}
            <View style={[styles.buttonContainer, isRTL && styles.buttonContainerRTL]}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!message.trim() || isSubmitting) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!message.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {t('feedback.send')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
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
  closeButton: {
    position: 'absolute',
    top: FIBONACCI.MD,
    right: FIBONACCI.MD,
    zIndex: 10,
    padding: FIBONACCI.XS,
  },
  closeButtonRTL: {
    right: undefined,
    left: FIBONACCI.MD,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: FIBONACCI.MD,
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
    marginBottom: 24,
    opacity: 0.9,
    paddingHorizontal: FIBONACCI.SM,
  },
  inputContainer: {
    width: '100%',
    position: 'relative',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
    width: '100%',
    minHeight: 120,
    textAlign: 'left',
  },
  textInputRTL: {
    textAlign: 'right',
  },
  charCount: {
    position: 'absolute',
    right: 16,
    bottom: -20,
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.7,
  },
  charCountRTL: {
    right: undefined,
    left: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 24,
    gap: FIBONACCI.SM,
  },
  buttonContainerRTL: {
    flexDirection: 'row-reverse',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  submitButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
