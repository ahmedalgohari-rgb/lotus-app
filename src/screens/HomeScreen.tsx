import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FIBONACCI, TYPOGRAPHY, ELEMENT_SIZES } from '../constants';
import { useStore } from '../store';
import { useRTL, useRTLStyles } from '../utils/rtl';
import { WeatherService } from '../services/weather';
import { WeatherData } from '../types';
import { changeLanguage, getCurrentLanguage } from '../i18n';
import { logger } from '../utils/logger';



// Helper function to determine season by calendar month for fallback
const getSeasonByMonth = () => {
  const month = new Date().getMonth(); // 0-11
  // Spring: March-May (2-4), Autumn: September-November (8-10)
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 8 && month <= 10) return 'Autumn';
  // Default to Spring for ambiguous months
  return 'Spring';
};

const getSeason = (temperature: number): string => {
  const month = new Date().getMonth(); // 0-11

  // Time-based season with 5-degree tolerance
  if (month >= 2 && month <= 4) { // Spring: Mar-May
    if (temperature >= 15 && temperature <= 35) return 'Spring';
  } else if (month >= 5 && month <= 7) { // Summer: Jun-Aug
    if (temperature > 25) return 'Summer';
  } else if (month >= 8 && month <= 10) { // Autumn: Sep-Nov
    if (temperature >= 15 && temperature <= 35) return 'Autumn';
  } else { // Winter: Dec-Feb
    if (temperature < 25) return 'Winter';
  }

  // Fallback to temperature-based season
  if (temperature < 20) return 'Winter';
  if (temperature > 30) return 'Summer';
  return getSeasonByMonth(); // Spring or Autumn for 20-30
}

// Comprehensive Cairo Plant Care Matrix based on season, temperature, UV, and sky conditions
const getPlantCareRecommendation = (temperature: number, condition: string) => {
  const season = getSeason(temperature);
  
  // Estimate UV level based on condition, temperature, and time of day
  let uvLevel = '';
  if ((condition === 'sunny' && temperature > 30) || (condition === 'clear' && temperature > 35)) uvLevel = 'High';
  else if (condition === 'sunny' || (condition === 'clear' && temperature > 25)) uvLevel = 'Med';
  else uvLevel = 'Low';
  
  // Map weather condition to sky state
  const sky = condition === 'sunny' ? 'Sunny' : 'Clear';
  
  // Comprehensive 12-row care matrix as provided
  const careMatrix = {
    // Winter <20°C
    'Winter-Low-Clear': { placement: 'South Window', watering: 'Light Water', humidity: 'Mist Low' },
    'Winter-Med-Sunny': { placement: 'East Window', watering: 'Light Water', humidity: 'Mist Med' },
    'Winter-High-Clear': { placement: 'Indirect East', watering: 'Mod Water', humidity: 'Mist Med' },
    
    // Spring 20–30°C
    'Spring-Low-Clear': { placement: 'South Window', watering: 'Mod Water', humidity: 'Mist Med' },
    'Spring-Med-Sunny': { placement: 'East Window', watering: 'Mod Water', humidity: 'Mist Med' },
    'Spring-High-Clear': { placement: 'NE / Shaded', watering: 'Mod Water', humidity: 'Mist High' },
    
    // Summer >30°C
    'Summer-Low-Clear': { placement: 'North Window', watering: 'Mod Water', humidity: 'Mist High' },
    'Summer-Med-Sunny': { placement: 'NE / Shaded', watering: 'Daily Check', humidity: 'Mist High' },
    'Summer-High-Clear': { placement: 'Shaded North', watering: 'Daily Check', humidity: 'Mist High' },
    
    // Autumn 20–30°C
    'Autumn-Low-Clear': { placement: 'South Window', watering: 'Mod Water', humidity: 'Mist Med' },
    'Autumn-Med-Sunny': { placement: 'East Window', watering: 'Mod Water', humidity: 'Mist Med' },
    'Autumn-High-Clear': { placement: 'NE / Shaded', watering: 'Mod Water', humidity: 'Mist High' },
  };
  
  const key = `${season}-${uvLevel}-${sky}`;
  return careMatrix[key] || { placement: 'East Window', watering: 'Mod Water', humidity: 'Mist Med' };
};


// Helper function to translate care matrix values based on language
const translateCareValue = (value: string, type: 'placement' | 'watering' | 'misting' | 'season', isRTL: boolean) => {
  if (!isRTL) return value;
  
  const translations = {
    placement: {
      'South Window': 'شباك جنوبي',
      'East Window': 'شباك شرقي',
      'North Window': 'شباك شمالي',
      'Indirect East': 'شرق غير مباشر',
      'NE / Shaded': 'شمال شرق / ظل',
      'Shaded North': 'شمال مظلل'
    },
    watering: {
      'Light Water': 'ري خفيف',
      'Mod Water': 'ري معتدل',
      'Daily Check': 'فحص يومي'
    },
    misting: {
      'Mist Low': 'رش قليل',
      'Mist Med': 'رش متوسط',
      'Mist High': 'رش كتير'
    },
    season: {
      'Winter': 'الشتا',
      'Spring': 'الربيع',
      'Summer': 'الصيف',
      'Autumn': 'الخريف'
    }
  };
  
  return translations[type][value] || value;
};

const careCards = [
  {
    id: 'watering',
    icon: 'water-outline',
    title: 'Watering',
    titleAr: 'السقي',
    description: 'Most plants need water every 5-7 days',
    tip: 'Tip: Check soil moisture first',
    cairoTip: 'Cairo Tip: More water needed in summer heat',
  },
  {
    id: 'light',
    icon: 'sunny-outline',
    title: 'Light',
    titleAr: 'الإضاءة',
    description: 'Bright indirect light is best for most plants',
    tip: 'Tip: Rotate plants weekly for even growth',
    cairoTip: 'Cairo Tip: North windows are ideal',
  },
  {
    id: 'position',
    icon: 'navigate-outline',
    title: 'Position',
    titleAr: 'الموقع',
    description: 'Window direction matters for plant health',
    tip: 'Tip: East & North are best for most plants',
    cairoTip: 'Cairo Tip: Avoid south-facing windows in summer',
  },
  {
    id: 'humidity',
    icon: 'leaf-outline',
    title: 'Humidity',
    titleAr: 'الرطوبة',
    description: 'Most houseplants prefer 40-60% humidity',
    tip: 'Tip: Group plants together to increase humidity',
    cairoTip: 'Cairo Tip: Use humidifier in winter',
  },
];

export default function HomeScreen() {
  const { user, weather, setWeather, setIsRTL, setUser, setAuthenticated, clearStorage, isFirstVisit, markAsReturningUser } = useStore();
  const [weatherLoading, setWeatherLoading] = useState(false);
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const isRTL = useRTL();
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());

  useEffect(() => {
    loadWeatherData();

    // Mark user as returning after they visit home screen
    if (isFirstVisit) {
      // Wait a bit to show the first-time greeting
      setTimeout(() => {
        markAsReturningUser();
      }, 2000); // Wait 2 seconds before marking as returning user
    }
  }, []);

  const loadWeatherData = async (showLoading = true) => {
    if (showLoading) {
      setWeatherLoading(true);
    }
    
    try {
      const weatherData = await WeatherService.getCurrentWeather();
      if (weatherData) {
        setWeather(weatherData);
      } else {
        logger.warn('No weather data received');
      }
    } catch (error) {
      // Weather service will handle fallback to mock data
    } finally {
      if (showLoading) {
        setWeatherLoading(false);
      }
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const toggleLanguage = async () => {
    const newLanguage = currentLanguage === 'en' ? 'ar' : 'en';
    try {
      await changeLanguage(newLanguage);
      setCurrentLanguage(newLanguage);
      setIsRTL(newLanguage === 'ar');
      
      // Refresh weather data to update language-specific content
      const updatedWeather = await WeatherService.refreshForLanguageChange();
      if (updatedWeather) {
        setWeather(updatedWeather);
      }
    } catch (error) {
      logger.error('Error changing language:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await clearStorage();
      setUser(null);
      setAuthenticated(false);
    } catch (error) {
      logger.error('Error logging out:', error);
    }
  };

  const refreshWeather = async () => {
    // Clear cache to force fresh data
    WeatherService.clearCache();
    await loadWeatherData(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
        scrollEventThrottle={16}
      >
        {/* Header - Always English Layout */}
        <View style={styles.header}>
          <View style={styles.greeting}>
            <Text style={styles.greetingText}>
              {user ? (
                isFirstVisit ? (
                  // First time user
                  <>
                    {t('home.welcomeFirst')}{isRTL ? ' ' : ', '}{user?.first_name || user?.name}! 🫡
                  </>
                ) : (
                  // Returning user
                  <>
                    {t('home.welcomeBack')}{isRTL ? ' ' : ', '}{user?.first_name || user?.name}! 👋
                  </>
                )
              ) : (
                // Guest user
                <>
                  {t('home.guestWelcome')}! 👋
                </>
              )}
            </Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.languageToggle} onPress={toggleLanguage}>
              <Text style={styles.languageToggleText}>
                {currentLanguage === 'en' ? 'عربي' : 'EN'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton}>
              <Ionicons name="person-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>





        {/* Care Guidelines */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>
            {t('home.careBasics')}
          </Text>
          
          <View style={styles.careGrid}>
            {careCards.map((card) => (
              <View key={card.id} style={styles.careCard}>
                <Ionicons name={card.icon as any} size={24} color={COLORS.primary} style={styles.cardIcon} />
                <Text style={[styles.cardTitle, isRTL && { textAlign: 'center', fontFamily: 'Arial' }]}>
                  {isRTL ? card.titleAr : card.title}
                </Text>
                <Text style={[styles.cardDescription, isRTL && { textAlign: 'center', fontFamily: 'Arial' }]}>
                  {isRTL ? t(`tips.${card.id}.description`) : card.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Weather Tips */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>
            {isRTL ? 'نصائح الطقس للنبات' : 'Weather Tips'}
          </Text>
          
          {weatherLoading ? (
            <View style={styles.weatherLoadingCard}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.weatherLoadingText}>Loading Cairo weather...</Text>
              <Text style={styles.weatherLoadingTextAr}>جاري تحميل بيانات الطقس...</Text>
            </View>
          ) : weather ? (
            <View style={styles.weatherCard}>
              <View style={[styles.weatherHeader, isRTL && styles.weatherHeaderRTL]}>
                {/* Weather text as anchor point with icons positioned closer */}
                <View style={[styles.weatherMain, isRTL && styles.weatherMainRTL]}>
                  <View style={[styles.weatherTempRow, isRTL && styles.weatherTempRowRTL]}>
                    <Text style={[styles.weatherTemp, isRTL && styles.weatherTempRTL]}>{weather.temperature}°C</Text>
                    {/* Icons positioned close to temp text */}
                    <View style={[styles.weatherIconSection, isRTL && styles.weatherIconSectionRTL]}>
                      <Text style={styles.weatherIcon}>
                        {(() => {
                          const hour = new Date().getHours();
                          const isNight = hour >= 19 || hour < 6;
                          if (isNight) {
                            if (weather.condition === 'cloudy') {
                              return '🌥️';
                            } else if (weather.condition === 'rainy') {
                              return '🌧️';
                            } else { // for 'sunny' or any other 'clear' like condition
                              return '🌖';
                            }
                          } else { // Day time
                            if (weather.condition === 'sunny') {
                              return '☀️';
                            } else if (weather.condition === 'cloudy') {
                              return '☁️';
                            } else if (weather.condition === 'rainy') {
                              return '🌧️';
                            } else { // for other day time conditions like partly cloudy
                              return '🌤️';
                            }
                          }
                        })()}
                      </Text>
                      <TouchableOpacity
                        onPress={refreshWeather}
                        style={styles.refreshButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="refresh-outline" size={20} color={COLORS.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={[styles.weatherLocation, isRTL && styles.weatherLocationRTL]}>{isRTL ? 'القاهرة' : 'Cairo'}</Text>
                  <Text style={[styles.weatherDescription, isRTL && styles.weatherDescriptionRTL]}>{weather.description}</Text>
                  <Text style={[styles.weatherUV, isRTL && styles.weatherUVRTL]}>
                    {isRTL ? `${t('careMatrix.labels.humidity')}: ${weather.humidity}%` : `Humidity: ${weather.humidity}%`}
                  </Text>
                </View>
              </View>

              

              {/* Cairo Weather Care Grid - 5 Essential Elements */}

              <View style={styles.plantCareGrid}>



                

                <View style={styles.plantCareRow}>

                  <View style={styles.plantCareItem}>

                    <View style={styles.plantCareIconContainer}>

                      <Ionicons name="location-outline" size={18} color={COLORS.primary} />

                    </View>

                    <Text style={[styles.plantCareLabel, { textAlign: 'center' }]}>

                      {isRTL ? t('careMatrix.labels.placement') : 'Placement'}

                    </Text>

                    <Text style={[styles.plantCareValue, { textAlign: 'center' }]}>

                      {translateCareValue(

                        getPlantCareRecommendation(weather.temperature, weather.condition).placement,

                        'placement',

                        isRTL

                      )}

                    </Text>

                  </View>

                  

                  <View style={styles.plantCareItem}>

                    <View style={styles.plantCareIconContainer}>

                      <Ionicons name="water-outline" size={18} color={COLORS.primary} />

                    </View>

                    <Text style={[styles.plantCareLabel, { textAlign: 'center' }]}>

                      {isRTL ? t('careMatrix.labels.watering') : 'Watering'}

                    </Text>

                    <Text style={[styles.plantCareValue, { textAlign: 'center' }]}>

                      {translateCareValue(

                        getPlantCareRecommendation(weather.temperature, weather.condition).watering,

                        'watering',

                        isRTL

                      )}

                    </Text>

                  </View>

                </View>

                

                <View style={styles.plantCareRow}>

                  <View style={styles.plantCareItem}>

                    <View style={styles.plantCareIconContainer}>

                      <Ionicons name="flower-outline" size={18} color={COLORS.primary} />

                    </View>

                    <Text style={[styles.plantCareLabel, { textAlign: 'center' }]}>

                      {isRTL ? t('careMatrix.labels.misting') : 'Misting'}

                    </Text>

                    <Text style={[styles.plantCareValue, { textAlign: 'center' }]}>

                      {translateCareValue(

                        getPlantCareRecommendation(weather.temperature, weather.condition).humidity,

                        'misting',

                        isRTL

                      )}

                    </Text>

                  </View>

                  

                  <View style={styles.plantCareItem}>

                    <View style={styles.plantCareIconContainer}>

                      <Ionicons name="time-outline" size={18} color={COLORS.primary} />

                    </View>

                    <Text style={[styles.plantCareLabel, { textAlign: 'center' }]}>

                      {isRTL ? t('careMatrix.labels.season') : 'Season'}

                    </Text>

                    <Text style={[styles.plantCareValue, { textAlign: 'center' }]}>

                      {(() => {

                        const season = getSeason(weather.temperature);

                        return translateCareValue(season, 'season', isRTL);

                      })()}

                    </Text>

                  </View>

                </View>

              </View>

            </View>          ) : (
            <View style={styles.weatherErrorCard}>
              <Text style={styles.weatherErrorText}>
                {isRTL ? 'لا يمكن تحميل بيانات الطقس' : 'Unable to load weather data'}
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => loadWeatherData()}>
                <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Sign Out Button - Positioned at bottom */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.authDesignButton}
            onPress={handleLogout}
          >
            <Text style={styles.authDesignButtonText}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20, // Extra padding for better scrolling
    paddingHorizontal: 16,
    minHeight: '100%', // Ensure full height
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 0,
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  greeting: {
    flex: 1,
  },
  greetingRTL: {
    alignItems: 'flex-end',
  },
  greetingText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 20,
    color: '#4F7751',
    marginBottom: FIBONACCI.XXS,
    textAlign: 'left',
  },
  greetingTextRTL: {
    textAlign: 'right',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButtonsRTL: {
    flexDirection: 'row-reverse',
  },
  languageToggle: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: FIBONACCI.MD,
    paddingVertical: FIBONACCI.XS,
    borderRadius: ELEMENT_SIZES.RADIUS_MD,
    marginRight: FIBONACCI.SM,
  },
  languageToggleText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.XS,
    fontWeight: '600',
  },
  profileButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },


  description: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.LG,
    paddingHorizontal: FIBONACCI.LG,
  },
  section: {
    marginTop: 0,
    marginBottom: FIBONACCI.LG,
    paddingHorizontal: FIBONACCI.LG,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    color: '#4F7751',
    marginTop: 16,
    marginBottom: FIBONACCI.MD,
    textAlign: 'left',
  },
  sectionTitleRTL: {
    textAlign: 'right',
  },

  careGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  careGridRTL: {
    flexDirection: 'row-reverse',
  },
  sectionTitleAr: {
    fontSize: TYPOGRAPHY.BASE,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: FIBONACCI.LG,
  },
  careCard: {
    backgroundColor: COLORS.white,
    borderRadius: ELEMENT_SIZES.RADIUS_MD,
    padding: FIBONACCI.LG,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: FIBONACCI.SM,
    elevation: 3,
  },
  cardIcon: {
    marginBottom: FIBONACCI.SM,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.SM,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: FIBONACCI.XS,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: TYPOGRAPHY.XS,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.MD,
  },
  cardTip: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.secondary,
    marginBottom: FIBONACCI.XS,
    fontStyle: 'italic',
  },
  cairoTip: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.warning,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: FIBONACCI.MD,
  },
  actionButtonsRTL: {
    flexDirection: 'row-reverse',
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: ELEMENT_SIZES.RADIUS_MD,
    padding: FIBONACCI.LG,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: FIBONACCI.XS,
    elevation: 3,
  },
  actionButtonRTL: {
    // Same centered layout for both languages
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.SM,
    fontWeight: '600',
    marginTop: FIBONACCI.XS,
    textAlign: 'center',
  },
  actionButtonTextAr: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.SM,
    marginTop: FIBONACCI.XXS,
  },
  actionButtonSecondary: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: ELEMENT_SIZES.RADIUS_MD,
    padding: FIBONACCI.LG,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: FIBONACCI.XS,
    elevation: 3,
  },
  actionButtonSecondaryRTLLayout: {
    // Same centered layout for both languages
  },
  actionButtonSecondaryText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.SM,
    fontWeight: '600',
    marginTop: FIBONACCI.XS,
    textAlign: 'center',
  },
  actionButtonSecondaryTextAr: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.SM,
    marginTop: FIBONACCI.XXS,
  },
  cairoTipsCard: {
    backgroundColor: COLORS.white,
    borderRadius: ELEMENT_SIZES.RADIUS_MD,
    padding: FIBONACCI.LG,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: FIBONACCI.SM,
    elevation: 3,
  },
  cairoTipsCardRTL: {
    borderLeftWidth: 0,
    borderRightWidth: 4,
    borderRightColor: COLORS.warning,
  },
  cairoTipsTitle: {
    fontSize: TYPOGRAPHY.BASE,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: FIBONACCI.SM,
    textAlign: 'left',
  },
  cairoTipsTitleRTL: {
    textAlign: 'right',
  },
  cairoTipsSubtitle: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.textSecondary,
    marginBottom: FIBONACCI.LG,
  },
  tipsList: {
    gap: FIBONACCI.XS,
  },
  tipsListRTL: {
    // Same gap layout for both languages
  },
  tipItem: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.text,
    lineHeight: TYPOGRAPHY.LG,
    textAlign: 'left',
  },
  tipItemRTL: {
    textAlign: 'right',
  },
  bottomPadding: {
    height: 80,
  },
  // Weather Widget Styles
  weatherLoadingCard: {
    backgroundColor: COLORS.white,
    borderRadius: ELEMENT_SIZES.RADIUS_LG,
    padding: FIBONACCI.LG,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: FIBONACCI.SM,
    elevation: 3,
  },
  weatherLoadingText: {
    marginTop: FIBONACCI.SM,
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.text,
  },
  weatherLoadingTextAr: {
    fontSize: TYPOGRAPHY.XS,
    color: COLORS.textSecondary,
    marginTop: FIBONACCI.XXS,
  },
  weatherCard: {
    backgroundColor: COLORS.white,
    borderRadius: ELEMENT_SIZES.RADIUS_LG,
    padding: FIBONACCI.LG,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: FIBONACCI.SM,
    elevation: 3,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: FIBONACCI.LG,
  },
  weatherMain: {
    flex: 1,
  },
  weatherMainRTL: {
    alignItems: 'flex-end', // Right align for Arabic
  },
  weatherTempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: FIBONACCI.XXS,
  },
  weatherTempRowRTL: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
  },
  weatherTemp: {
    fontSize: TYPOGRAPHY.XXL,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: FIBONACCI.XXS,
    textAlign: 'left',
  },
  weatherTempRTL: {
    textAlign: 'right',
  },
  weatherLocation: {
    fontSize: TYPOGRAPHY.BASE,
    color: COLORS.text,
    marginBottom: FIBONACCI.XXS,
    textAlign: 'left',
  },
  weatherLocationRTL: {
    textAlign: 'right',
  },
  weatherDescription: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.textSecondary,
    textAlign: 'left',
  },
  weatherDescriptionRTL: {
    textAlign: 'right',
  },
  weatherUV: {
    fontSize: TYPOGRAPHY.XS,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: FIBONACCI.XS,
    textAlign: 'left',
  },
  weatherUVRTL: {
    textAlign: 'right',
  },
  weatherHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  weatherIconSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: FIBONACCI.XS,
    marginLeft: FIBONACCI.SM, // Closer to text in English
  },
  weatherIconSectionRTL: {
    flexDirection: 'row-reverse',
    marginLeft: 0,
    marginRight: FIBONACCI.SM, // Closer to text in Arabic
  },
  weatherIcon: {
    fontSize: TYPOGRAPHY.HUGE,
  },
  refreshButton: {
    padding: FIBONACCI.XXS,
    borderRadius: ELEMENT_SIZES.RADIUS_MD,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: FIBONACCI.LG,
  },
  weatherDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: FIBONACCI.XS,
  },
  weatherDetailText: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.text,
  },

  // Unified Plant Care Grid Styles
  plantCareGrid: {
    marginTop: FIBONACCI.LG,
    paddingTop: FIBONACCI.LG,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  plantCareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: FIBONACCI.MD,
  },
  plantCareItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: FIBONACCI.XXS,
  },
  plantCareIconContainer: {
    width: FIBONACCI.XL,
    height: FIBONACCI.XL,
    borderRadius: FIBONACCI.MD,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: FIBONACCI.XS,
  },
  plantCareIcon: {
    fontSize: TYPOGRAPHY.MD,
  },
  plantCareLabel: {
    fontSize: TYPOGRAPHY.XXS,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: FIBONACCI.XXS,
    textAlign: 'center',
  },
  plantCareValue: {
    fontSize: TYPOGRAPHY.XS,
    color: COLORS.text,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.BASE,
  },
  weatherErrorCard: {
    backgroundColor: COLORS.white,
    borderRadius: ELEMENT_SIZES.RADIUS_LG,
    padding: FIBONACCI.LG,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: FIBONACCI.SM,
    elevation: 3,
  },
  weatherErrorText: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.error || '#dc2626',
    marginBottom: FIBONACCI.XXS,
  },
  weatherErrorTextAr: {
    fontSize: TYPOGRAPHY.XS,
    color: COLORS.textSecondary,
    marginBottom: FIBONACCI.MD,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: FIBONACCI.LG,
    paddingVertical: FIBONACCI.SM,
    borderRadius: ELEMENT_SIZES.RADIUS_SM,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.SM,
    fontWeight: '500',
  },
  // Care Advice Styles
  careAdviceContainer: {
    marginTop: 0,
  },
  careConditions: {
    backgroundColor: '#f0f7ff',
    paddingHorizontal: FIBONACCI.MD,
    paddingVertical: FIBONACCI.XS,
    borderRadius: ELEMENT_SIZES.RADIUS_SM,
    marginBottom: FIBONACCI.MD,
    alignItems: 'center',
  },
  careConditionText: {
    fontSize: TYPOGRAPHY.XS,
    color: COLORS.primary,
    fontWeight: '500',
  },
  careAdviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: FIBONACCI.SM,
  },
  careAdviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: FIBONACCI.XXS,
  },
  careAdviceIconContainer: {
    width: FIBONACCI.LG,
    height: FIBONACCI.LG,
    borderRadius: FIBONACCI.MD,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: FIBONACCI.SM,
  },
  careAdviceContent: {
    flex: 1,
  },
  careAdviceLabel: {
    fontSize: TYPOGRAPHY.XXS,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: FIBONACCI.XXS,
  },
  careAdviceValue: {
    fontSize: TYPOGRAPHY.XS,
    color: COLORS.text,
    fontWeight: '600',
  },
  // Auth Design Button Styles
  authDesignButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: FIBONACCI.MD, // 13px - Golden ratio padding
    paddingHorizontal: FIBONACCI.LG, // 21px - Golden ratio padding
    borderRadius: ELEMENT_SIZES.RADIUS_MD, // 13px - Golden ratio rounding
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: FIBONACCI.XXS }, // 3px shadow
    shadowOpacity: 0.15,
    shadowRadius: FIBONACCI.SM, // 8px shadow radius
    elevation: 3,
    marginBottom: FIBONACCI.LG, // 21px - Extra spacing at bottom
  },
  authDesignButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.BASE, // 16px - Golden ratio typography
    fontWeight: '600',
    textAlign: 'center',
  },
});