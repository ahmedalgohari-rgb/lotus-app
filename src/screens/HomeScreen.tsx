import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, FIBONACCI, TYPOGRAPHY, ELEMENT_SIZES } from '../constants';
import { useStore } from '../store';
import { useRTL } from '../utils/rtl';
import { WeatherService } from '../services/weather';
import { Plant } from '../types';
import { changeLanguage, getCurrentLanguage } from '../i18n';
import { logger } from '../utils/logger';
import AccountDrawer from '../components/AccountDrawer';
import { dbService } from '../services/supabase';



// Helper function to determine season using official astronomical dates
const getOfficialSeason = (): 'Winter' | 'Spring' | 'Summer' | 'Autumn' => {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const day = now.getDate();

  // Official astronomical season dates (Egypt/Northern Hemisphere)
  // Winter: Dec 21 - Mar 20
  // Spring: Mar 21 - Jun 20
  // Summer: Jun 21 - Sep 22
  // Autumn: Sep 23 - Dec 20

  if ((month === 11 && day >= 21) || month === 0 || month === 1 || (month === 2 && day <= 20)) {
    return 'Winter';
  }
  if ((month === 2 && day >= 21) || month === 3 || month === 4 || (month === 5 && day <= 20)) {
    return 'Spring';
  }
  if ((month === 5 && day >= 21) || month === 6 || month === 7 || (month === 8 && day <= 22)) {
    return 'Summer';
  }
  return 'Autumn';
};

const getSeason = (temperature: number): string => {
  // Use official astronomical dates for season determination
  return getOfficialSeason();
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

export default function HomeScreen() {
  const { user, isGuest, weather, setWeather, setIsRTL, isFirstVisit, markAsReturningUser, checkSeasonChange } = useStore();
  const [weatherLoading, setWeatherLoading] = useState(false);
  const { t } = useTranslation();
  const isRTL = useRTL();
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  const [isAccountDrawerVisible, setIsAccountDrawerVisible] = useState(false);

  // Garden stats
  const [plants, setPlants] = useState<Plant[]>([]);
  const [gardenStats, setGardenStats] = useState({
    total: 0,
    needsWater: 0,
    thriving: 0
  });

  useEffect(() => {
    loadWeatherData();
    loadPlants();
    checkForSeasonChange();

    // Mark user as returning after they visit home screen
    if (isFirstVisit) {
      // Wait a bit to show the first-time greeting
      setTimeout(() => {
        markAsReturningUser();
      }, 2000); // Wait 2 seconds before marking as returning user
    }
  }, []);

  // Check if season has changed and notify user
  const checkForSeasonChange = async () => {
    try {
      const seasonChanged = await checkSeasonChange();

      if (seasonChanged) {
        // Get the current season name for the notification using official dates
        const currentSeason = getOfficialSeason();
        const seasonNames: Record<string, { en: string; ar: string }> = {
          'Winter': { en: 'winter', ar: 'الشتاء' },
          'Spring': { en: 'spring', ar: 'الربيع' },
          'Summer': { en: 'summer', ar: 'الصيف' },
          'Autumn': { en: 'fall', ar: 'الخريف' }
        };
        const seasonName = seasonNames[currentSeason]?.en || 'spring';
        const seasonNameAr = seasonNames[currentSeason]?.ar || 'الربيع';

        // Show notification about season change
        const message = isRTL
          ? `تم تحديث نصائح العناية بالنباتات لفصل ${seasonNameAr} 🌿`
          : `Care tips updated for ${seasonName} 🌿`;

        const title = isRTL ? 'تغير الموسم' : 'Season Changed';

        // Show alert after a brief delay so it doesn't interfere with app loading
        setTimeout(() => {
          Alert.alert(title, message);
        }, 1500);

        logger.info('Season change notification shown', { season: seasonName });
      }
    } catch (error) {
      logger.error('Error checking season change:', error);
    }
  };

  const loadPlants = async () => {
    if (isGuest || !user?.id) {
      setPlants([]);
      setGardenStats({ total: 0, needsWater: 0, thriving: 0 });
      return;
    }

    try {
      const { data: userPlants } = await dbService.getPlants(user.id);
      if (userPlants) {
        setPlants(userPlants);

        // Calculate stats
        const total = userPlants.length;
        const now = new Date();

        // NEEDS WATER = Never watered OR overdue for watering
        const needsWater = userPlants.filter(plant => {
          // Case 1: Never been watered (no last_watered_at)
          if (!plant.last_watered_at) return true;

          // Case 2: Has next_watering_at and it's in the past (overdue)
          if (plant.next_watering_at) {
            const nextWateringDate = new Date(plant.next_watering_at);
            return now > nextWateringDate; // Overdue
          }

          return false;
        }).length;

        // THRIVING = Good placement (3-5 stars) AND good watering (watered + not overdue)
        const thriving = userPlants.filter(plant => {
          // Check placement score (3, 4, or 5 stars = Good, Very Good, or Excellent)
          const hasGoodPlacement = plant.placement_score && plant.placement_score >= 3;

          // Check watering status (has been watered AND not overdue)
          const hasBeenWatered = !!plant.last_watered_at;
          const isNotOverdue = plant.next_watering_at
            ? now <= new Date(plant.next_watering_at)
            : true; // If no next watering date, assume on schedule

          return hasGoodPlacement && hasBeenWatered && isNotOverdue;
        }).length;

        setGardenStats({ total, needsWater, thriving });
      }
    } catch (error) {
      logger.error('Error loading plants:', error);
      setPlants([]);
      setGardenStats({ total: 0, needsWater: 0, thriving: 0 });
    }
  };

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
              {isGuest || !user ? (
                // Guest user - no personalization
                <>
                  {t('home.guestWelcome')}! 👋
                </>
              ) : (
                // Authenticated user
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
              )}
            </Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.languageToggle} onPress={toggleLanguage}>
              <Text style={styles.languageToggleText}>
                {currentLanguage === 'en' ? 'عربي' : 'EN'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => setIsAccountDrawerVisible(true)}
            >
              <Ionicons name="person-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>





        {/* Care Tracker - Only show for authenticated users with plants */}
        {!isGuest && user && gardenStats.total > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>
              {isRTL ? 'متتبع العناية' : 'Care Tracker'}
            </Text>

            <View style={styles.gardenStatsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{gardenStats.total}</Text>
                <Text style={styles.statLabel}>{isRTL ? 'نباتاتك' : 'Your\nPlants'}</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{gardenStats.needsWater}</Text>
                <Text style={styles.statLabel}>{isRTL ? 'يحتاج ري' : 'Need\nWater'}</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{gardenStats.thriving}</Text>
                <Text style={styles.statLabel}>{isRTL ? 'مزدهر' : 'Thriving'}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Weather Tips */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>
            {isRTL ? 'نصائح الطقس للنبات' : 'Weather Tips'}
          </Text>
          
          {weatherLoading ? (
            <View style={styles.weatherLoadingCard}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.weatherLoadingText}>{t('home.loadingWeather')}</Text>
            </View>
          ) : weather ? (
            <View style={styles.weatherCard}>
              <View style={[styles.weatherHeader, isRTL && styles.weatherHeaderRTL]}>
                {/* Weather text as anchor point with icons positioned closer */}
                <View style={[styles.weatherMain, isRTL && styles.weatherMainRTL]}>
                  <View style={[styles.weatherTempRow, isRTL && styles.weatherTempRowRTL]}>
                    <View style={styles.weatherTempContainer}>
                      <Text style={[styles.weatherTemp, isRTL && styles.weatherTempRTL]}>{weather.temperature}°C</Text>
                      <Text style={[styles.weatherAvgLabel, isRTL && styles.weatherAvgLabelRTL]}>
                        {isRTL ? 'متوسط اليوم' : "Today's Avg"}
                      </Text>
                    </View>
                    {/* Weather icon positioned close to temp text */}
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
                    </View>
                  </View>
                  <Text style={[styles.weatherLocation, isRTL && styles.weatherLocationRTL]}>{weather.location}</Text>
                  <Text style={[styles.weatherDescription, isRTL && styles.weatherDescriptionRTL]}>{weather.description}</Text>
                  <Text style={[styles.weatherUV, isRTL && styles.weatherUVRTL]}>
                    {isRTL ? `${t('careMatrix.labels.humidity')}: ${weather.humidity}%` : `Humidity: ${weather.humidity}%`}
                  </Text>
                </View>
              </View>

              

              {/* Cairo Weather Care Grid */}
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
                      {translateCareValue(getSeason(weather.temperature), 'season', isRTL)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.weatherErrorCard}>
              <Text style={styles.weatherErrorText}>
                {t('home.weatherError')}
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => loadWeatherData()}>
                <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Account Drawer */}
      <AccountDrawer
        visible={isAccountDrawerVisible}
        onClose={() => setIsAccountDrawerVisible(false)}
        userName={user?.first_name || user?.name || 'Guest'}
      />
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
  greeting: {
    flex: 1,
  },
  greetingText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 20,
    color: '#4F7751',
    marginBottom: FIBONACCI.XXS,
    textAlign: 'left',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    width: FIBONACCI.XL,
    height: FIBONACCI.XL,
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
  // Garden Stats Styles
  gardenStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: FIBONACCI.MD,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: ELEMENT_SIZES.RADIUS_MD,
    padding: FIBONACCI.LG,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 90,
  },
  statNumber: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 32,
    color: COLORS.primary,
    marginBottom: FIBONACCI.XS,
  },
  statLabel: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: TYPOGRAPHY.XS,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
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
  weatherTempContainer: {
    flexDirection: 'column',
  },
  weatherAvgLabel: {
    fontSize: TYPOGRAPHY.XS,
    color: COLORS.textSecondary,
    marginTop: -4,
    textAlign: 'left',
  },
  weatherAvgLabelRTL: {
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
  // Error and retry styles
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
});