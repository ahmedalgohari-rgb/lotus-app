/**
 * Lotus i18n Configuration
 * Arabic and English localization setup
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// Removed expo-localization to prevent native module issues
// import { getLocales } from 'expo-localization';

// Import translation files
import en from './translations/en.json';
import ar from './translations/ar.json';

// Default to English to avoid native module calls
const deviceLanguage = 'en';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      en: {
        translation: en,
      },
      ar: {
        translation: ar,
      },
    },
    lng: deviceLanguage.startsWith('ar') ? 'ar' : 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;