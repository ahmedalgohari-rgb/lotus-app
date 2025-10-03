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
import { COLORS } from '../constants';
import { useStore } from '../store';
import { useRTL, useRTLStyles } from '../utils/rtl';
import { WeatherService } from '../services/weather';
import { WeatherData } from '../types';
import { changeLanguage, getCurrentLanguage } from '../i18n';

// Comprehensive Cairo Plant Care Matrix based on season, temperature, UV, and sky conditions
const getPlantCareRecommendation = (temperature: number, condition: string) => {
  // Determine season based on temperature ranges for Cairo
  let season = '';
  if (temperature < 20) season = 'Winter';
  else if (temperature >= 20 && temperature <= 30) season = getSeasonByMonth(); // Spring or Autumn
  else season = 'Summer';
  
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

// Helper function to determine season by calendar month when temperature is 20-30°C
const getSeasonByMonth = () => {
  const month = new Date().getMonth(); // 0-11
  // Spring: March-May (2-4), Autumn: September-November (8-10)
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 8 && month <= 10) return 'Autumn';
  // Default to Spring for ambiguous months
  return 'Spring';
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
  const { user, weather, setWeather, setIsRTL, setUser, setAuthenticated, clearStorage } = useStore();
  const [weatherLoading, setWeatherLoading] = useState(false);
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const isRTL = useRTL();
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());

  useEffect(() => {
    loadWeatherData();
  }, []);

  const loadWeatherData = async (showLoading = true) => {
    if (showLoading) {
      setWeatherLoading(true);
    }
    
    try {
      const weatherData = await WeatherService.getCurrentWeather();
      if (weatherData) {
        setWeather(weatherData);
        console.log('Weather data loaded successfully');
      } else {
        console.warn('No weather data received');
      }
    } catch (error) {
      console.log('Weather loading handled by service with fallback data');
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
      console.error('Error changing language:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await clearStorage();
      setUser(null);
      setAuthenticated(false);
    } catch (error) {
      console.error('Error logging out:', error);
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
              {user ? t('home.welcome') : t('home.guestWelcome')}, {user?.first_name || t('auth.guestMode')}! 👋
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

        {/* App Introduction */}
        <View style={styles.introSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>🌿</Text>
            <Text style={styles.appName}>LOTUS</Text>
          </View>
          <Text style={[styles.tagline, isRTL && styles.taglineRTL]}>
            {t('auth.subtitle')}
          </Text>
          {/* Temporary button to see new auth design */}
          <TouchableOpacity 
            style={{
              backgroundColor: COLORS.primary,
              padding: 12,
              borderRadius: 8,
              marginTop: 16,
            }}
            onPress={handleLogout}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
              See New Auth Design
            </Text>
          </TouchableOpacity>
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
                        {weather.condition === 'sunny' ? '☀️' : 
                         weather.condition === 'cloudy' ? '☁️' :
                         weather.condition === 'rainy' ? '🌧️' : '🌤️'}
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
                    UV: {(() => {
                      const condition = weather.condition;
                      const temperature = weather.temperature;
                      // Calculate UV index based on conditions
                      if ((condition === 'sunny' && temperature > 35)) return '10';
                      else if ((condition === 'sunny' && temperature > 30)) return '8';
                      else if (condition === 'sunny' || (condition === 'mild' && temperature > 25)) return '6';
                      else if (condition === 'mild' && temperature > 20) return '4';
                      else return '2';
                    })()}
                  </Text>
                </View>
              </View>
              
              {/* Cairo Weather Care Grid - 5 Essential Elements */}
              <View style={styles.plantCareGrid}>
                <View style={styles.plantCareRow}>
                  <View style={styles.plantCareItem}>
                    <View style={styles.plantCareIconContainer}>
                      <Ionicons name="thermometer-outline" size={18} color={COLORS.primary} />
                    </View>
                    <Text style={[styles.plantCareLabel, { textAlign: 'center' }]}>
                      {isRTL ? t('careMatrix.labels.temp') : 'Temp'}
                    </Text>
                    <Text style={[styles.plantCareValue, { textAlign: 'center' }]}>{weather.temperature}°C</Text>
                  </View>
                  
                  <View style={styles.plantCareItem}>
                    <View style={styles.plantCareIconContainer}>
                      <Ionicons name="leaf-outline" size={18} color={COLORS.primary} />
                    </View>
                    <Text style={[styles.plantCareLabel, { textAlign: 'center' }]}>
                      {isRTL ? t('careMatrix.labels.humidity') : 'Humidity'}
                    </Text>
                    <Text style={[styles.plantCareValue, { textAlign: 'center' }]}>{weather.humidity}%</Text>
                  </View>
                </View>
                
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
                        const season = weather.temperature > 30 ? 'Summer' :
                                     weather.temperature < 20 ? 'Winter' : 
                                     getSeasonByMonth();
                        return translateCareValue(season, 'season', isRTL);
                      })()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
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

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>
            {t('home.quickActions')}
          </Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Scan')}
            >
              <Ionicons name="camera-outline" size={24} color={COLORS.white} />
              <Text style={styles.actionButtonText}>{t('scan.title')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButtonSecondary}
              onPress={() => navigation.navigate('Plants')}
            >
              <Ionicons name="leaf-outline" size={24} color={COLORS.primary} />
              <Text style={styles.actionButtonSecondaryText}>{t('plants.title')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cairo Tips */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>
            {t('home.cairoTips')}
          </Text>
          
          <View style={[styles.cairoTipsCard, isRTL && { borderLeftWidth: 0, borderRightWidth: 4, borderRightColor: '#F59E0B' }]}>
            <Text style={[styles.cairoTipsTitle, isRTL && { textAlign: 'right' }]}>
              🏛️ {t('tips.cairo.seasonal')}
            </Text>
            
            <View style={styles.tipsList}>
              <Text style={[styles.tipItem, isRTL && { textAlign: 'right' }]}>
                • {t('tips.cairo.summer')}
              </Text>
              <Text style={[styles.tipItem, isRTL && { textAlign: 'right' }]}>
                • {t('tips.cairo.winter')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
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
    paddingBottom: 150, // Extra padding for better scrolling
    paddingHorizontal: 16,
    minHeight: '100%', // Ensure full height
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
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
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
  },
  languageToggleText: {
    color: COLORS.white,
    fontSize: 12,
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
  introSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    fontSize: 36,
    marginBottom: 6,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  taglineRTL: {
    textAlign: 'right',
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 12,
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
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 16,
  },
  careCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIcon: {
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 11,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 16,
  },
  cardTip: {
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  cairoTip: {
    fontSize: 14,
    color: COLORS.warning,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButtonsRTL: {
    flexDirection: 'row-reverse',
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  actionButtonRTL: {
    // Same centered layout for both languages
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  actionButtonTextAr: {
    color: COLORS.white,
    fontSize: 14,
    marginTop: 2,
  },
  actionButtonSecondary: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  actionButtonSecondaryRTLLayout: {
    // Same centered layout for both languages
  },
  actionButtonSecondaryText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  actionButtonSecondaryTextAr: {
    color: COLORS.primary,
    fontSize: 14,
    marginTop: 2,
  },
  cairoTipsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cairoTipsCardRTL: {
    borderLeftWidth: 0,
    borderRightWidth: 4,
    borderRightColor: COLORS.warning,
  },
  cairoTipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'left',
  },
  cairoTipsTitleRTL: {
    textAlign: 'right',
  },
  cairoTipsSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  tipsList: {
    gap: 6,
  },
  tipsListRTL: {
    // Same gap layout for both languages
  },
  tipItem: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
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
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  weatherLoadingText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.text,
  },
  weatherLoadingTextAr: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  weatherCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    marginBottom: 4,
  },
  weatherTempRowRTL: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
  },
  weatherTemp: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
    textAlign: 'left',
  },
  weatherTempRTL: {
    textAlign: 'right',
  },
  weatherLocation: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 2,
    textAlign: 'left',
  },
  weatherLocationRTL: {
    textAlign: 'right',
  },
  weatherDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'left',
  },
  weatherDescriptionRTL: {
    textAlign: 'right',
  },
  weatherUV: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 4,
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
    gap: 6,
    marginLeft: 8, // Closer to text in English
  },
  weatherIconSectionRTL: {
    flexDirection: 'row-reverse',
    marginLeft: 0,
    marginRight: 8, // Closer to text in Arabic
  },
  weatherIcon: {
    fontSize: 48,
  },
  refreshButton: {
    padding: 4,
    borderRadius: 12,
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
    marginBottom: 16,
  },
  weatherDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weatherDetailText: {
    fontSize: 14,
    color: COLORS.text,
  },
  // Unified Plant Care Grid Styles
  plantCareGrid: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  plantCareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  plantCareItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  plantCareIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  plantCareIcon: {
    fontSize: 18,
  },
  plantCareLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 3,
    textAlign: 'center',
  },
  plantCareValue: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  weatherErrorCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  weatherErrorText: {
    fontSize: 14,
    color: COLORS.error || '#dc2626',
    marginBottom: 2,
  },
  weatherErrorTextAr: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
  // Care Advice Styles
  careAdviceContainer: {
    marginTop: 0,
  },
  careConditions: {
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  careConditionText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  careAdviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  careAdviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  careAdviceIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  careAdviceContent: {
    flex: 1,
  },
  careAdviceLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  careAdviceValue: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
  },
});