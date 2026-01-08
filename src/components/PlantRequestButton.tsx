import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FIBONACCI, TYPOGRAPHY, ELEMENT_SIZES } from '../constants';

interface PlantRequestButtonProps {
  plantName: string;
  scientificName: string;
  buttonText?: string;
  variant?: 'primary' | 'secondary';
  onPress?: () => void;
}

export default function PlantRequestButton({
  plantName,
  scientificName,
  buttonText,
  variant = 'primary',
  onPress,
}: PlantRequestButtonProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePress = async () => {
    setIsLoading(true);

    try {
      // Simulate network request (500ms delay)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Store request in AsyncStorage (optional tracking for Phase 2)
      const requestData = {
        plantName,
        scientificName,
        requestedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        `care_request_${scientificName}`,
        JSON.stringify(requestData)
      );

      // Call optional callback
      onPress?.();

      // Set success state
      setIsSuccess(true);
    } catch (error) {
      console.error('Failed to submit request:', error);
      // Still show success to user (silent failure for Phase 2)
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine styles based on variant
  const isPrimary = variant === 'primary';
  const buttonStyle = [
    styles.button,
    isPrimary ? styles.buttonPrimary : styles.buttonSecondary,
    isSuccess && styles.buttonSuccess,
  ];

  const textStyle = [
    styles.buttonText,
    isPrimary ? styles.buttonTextPrimary : styles.buttonTextSecondary,
    isSuccess && styles.buttonTextSuccess,
  ];

  // Success state
  if (isSuccess) {
    return (
      <TouchableOpacity style={buttonStyle} disabled activeOpacity={1}>
        <Ionicons
          name="checkmark-circle"
          size={FIBONACCI.LG}
          color={COLORS.success}
        />
        <Text style={textStyle}>
          {t('plantRequest.requested')}
        </Text>
      </TouchableOpacity>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <TouchableOpacity style={buttonStyle} disabled activeOpacity={1}>
        <ActivityIndicator size="small" color={isPrimary ? COLORS.white : COLORS.primary} />
        <Text style={textStyle}>
          {t('plantRequest.submitting')}
        </Text>
      </TouchableOpacity>
    );
  }

  // Default state
  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Ionicons
        name="notifications-outline"
        size={FIBONACCI.LG}
        color={isPrimary ? COLORS.white : COLORS.primary}
      />
      <Text style={textStyle}>
        {buttonText || t('plantRequest.requestCare')}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: ELEMENT_SIZES.BUTTON_MD, // 55px
    paddingHorizontal: FIBONACCI.LG, // 21px
    borderRadius: ELEMENT_SIZES.RADIUS_MD, // 13px
    gap: FIBONACCI.SM, // 8px between icon and text
    marginTop: FIBONACCI.MD, // 13px
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary, // #2D5F3F
  },
  buttonSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  buttonSuccess: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.MD, // 18px
    fontWeight: '600',
  },
  buttonTextPrimary: {
    color: COLORS.white,
  },
  buttonTextSecondary: {
    color: COLORS.primary,
  },
  buttonTextSuccess: {
    color: COLORS.success,
  },
});
