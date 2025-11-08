import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS, FIBONACCI, TYPOGRAPHY } from '../constants';
import { useRTL } from '../utils/rtl';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NameCollectionModalProps {
  visible: boolean;
  onSubmit: (name: string) => void;
}

export default function NameCollectionModal({ visible, onSubmit }: NameCollectionModalProps) {
  const { t } = useTranslation();
  const isRTL = useRTL();
  const [name, setName] = useState('');

  const handleSubmit = () => {
    const trimmedName = name.trim();

    if (trimmedName.length < 3) {
      return; // Silently prevent submission
    }

    onSubmit(trimmedName);
    setName(''); // Reset for next time
  };

  const handleNameChange = (text: string) => {
    // Only allow letters and spaces, max 10 characters
    const filtered = text.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, '').slice(0, 10);
    setName(filtered);
  };

  const isValid = name.trim().length >= 3;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => {
        // Prevent dismissal - user must enter name
      }}
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
          <View style={styles.contentContainer}>
            {/* Title - Bilingual */}
            <Text style={[styles.title, isRTL && styles.titleRTL]}>
              {t('nameCollection.title')}
            </Text>

            {/* Subtitle */}
            <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>
              {t('nameCollection.subtitle')}
            </Text>

            {/* Name Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  isRTL && styles.inputRTL,
                ]}
                placeholder={t('nameCollection.placeholder')}
                placeholderTextColor={COLORS.textSecondary}
                value={name}
                onChangeText={handleNameChange}
                maxLength={10}
                autoFocus={true}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                textAlign={isRTL ? 'right' : 'left'}
              />
              <Text style={[styles.charCount, isRTL && styles.charCountRTL]}>
                {name.length}/10
              </Text>
            </View>

            {/* OK Button */}
            <TouchableOpacity
              style={[
                styles.okButton,
                !isValid && styles.okButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isValid}
            >
              <Text style={styles.okButtonText}>
                {t('nameCollection.okButton')}
              </Text>
            </TouchableOpacity>
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
  contentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.LG,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  titleRTL: {
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.9,
  },
  subtitleRTL: {
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    position: 'relative',
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
    width: '100%',
    textAlign: 'left',
  },
  inputRTL: {
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
  okButton: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  okButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  okButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
