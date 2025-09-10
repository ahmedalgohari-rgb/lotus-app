/**
 * RTL Support Hook
 * Handles RTL layout and language switching
 */
import { useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';

const RTL_STORAGE_KEY = 'lotus_rtl_enabled';

export const useRTL = () => {
  const { i18n } = useTranslation();
  const [isRTL, setIsRTL] = useState(I18nManager.isRTL);
  const [isLoading, setIsLoading] = useState(false);

  const currentLanguage = i18n.language;
  const isArabic = currentLanguage === 'ar';

  // Check if RTL should be enabled based on language
  const shouldEnableRTL = isArabic;

  useEffect(() => {
    // Load saved RTL preference
    loadRTLPreference();
  }, []);

  useEffect(() => {
    // Update RTL when language changes
    if (shouldEnableRTL !== isRTL) {
      handleRTLChange(shouldEnableRTL);
    }
  }, [shouldEnableRTL, isRTL]);

  const loadRTLPreference = async () => {
    try {
      const savedRTL = await AsyncStorage.getItem(RTL_STORAGE_KEY);
      if (savedRTL !== null) {
        const rtlEnabled = JSON.parse(savedRTL);
        setIsRTL(rtlEnabled);
      }
    } catch (error) {
      logger.error('Error loading RTL preference', error);
    }
  };

  const handleRTLChange = async (enableRTL: boolean) => {
    try {
      setIsLoading(true);
      
      // Save preference
      await AsyncStorage.setItem(RTL_STORAGE_KEY, JSON.stringify(enableRTL));
      
      // Update I18nManager
      I18nManager.allowRTL(enableRTL);
      I18nManager.forceRTL(enableRTL);
      
      setIsRTL(enableRTL);
      
      // Restart app to apply RTL changes properly
      if (I18nManager.isRTL !== enableRTL) {
        if (__DEV__) {
          logger.debug('RTL change requires app restart in production');
        } else {
          // In production, restart the app
          Updates.reloadAsync();
        }
      }
    } catch (error) {
      logger.error('Error changing RTL', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (language: 'en' | 'ar') => {
    try {
      setIsLoading(true);
      await i18n.changeLanguage(language);
      
      // Update user preference in auth store
      // This will be handled by the auth store
      
    } catch (error) {
      logger.error('Error changing language', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLanguage = () => {
    const newLanguage = currentLanguage === 'ar' ? 'en' : 'ar';
    changeLanguage(newLanguage);
  };

  return {
    isRTL,
    isArabic,
    currentLanguage,
    isLoading,
    changeLanguage,
    toggleLanguage,
    textAlign: isRTL ? 'right' as const : 'left' as const,
    flexDirection: isRTL ? 'row-reverse' as const : 'row' as const,
    writingDirection: isRTL ? 'rtl' as const : 'ltr' as const,
  };
};