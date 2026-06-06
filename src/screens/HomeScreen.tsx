import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FIBONACCI, TYPOGRAPHY, ELEMENT_SIZES } from '../constants';
import { useStore } from '../store';
import { useRTL } from '../utils/rtl';
import { WeatherService } from '../services/weather';
import { Plant } from '../types';
import { changeLanguage, getCurrentLanguage } from '../i18n';
import { logger } from '../utils/logger';
import AccountDrawer from '../components/AccountDrawer';
import SearchBar from '../components/SearchBar';
import WeatherTrackerModal from '../components/WeatherTrackerModal';
import { dbService } from '../services/supabase';
import { getDisplaySeason } from '../utils/season';

// Weather emoji based on condition and time of day
const getWeatherEmoji = (condition: string) => {
  const hour = new Date().getHours();
  const isNight = hour >= 19 || hour < 6;
  if (isNight) {
    if (condition === 'cloudy') return '🌥️';
    if (condition === 'rainy') return '🌧️';
    return '🌖';
  }
  if (condition === 'sunny') return '☀️';
  if (condition === 'cloudy') return '☁️';
  if (condition === 'rainy') return '🌧️';
  return '🌤️';
};

export default function HomeScreen() {
  const { user, isGuest, weather, setWeather, setIsRTL, isFirstVisit, markAsReturningUser, checkSeasonChange } = useStore();
  const [weatherLoading, setWeatherLoading] = useState(false);
  const { t } = useTranslation();
  const isRTL = useRTL();
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  const [isAccountDrawerVisible, setIsAccountDrawerVisible] = useState(false);
  const [isWeatherModalVisible, setIsWeatherModalVisible] = useState(false);
  const navigation = useNavigation<any>();

  // Garden stats
  const [plants, setPlants] = useState<Plant[]>([]);
  const [gardenStats, setGardenStats] = useState({
    total: 0,
    needsWater: 0,
    thriving: 0
  });

  // Press-scale animation values
  const scaleLanguage = useRef(new Animated.Value(1)).current;
  const scaleProfile = useRef(new Animated.Value(1)).current;
  const scaleIdentify = useRef(new Animated.Value(1)).current;
  const scaleOrient = useRef(new Animated.Value(1)).current;
  const scaleWater = useRef(new Animated.Value(1)).current;
  const scaleReminder = useRef(new Animated.Value(1)).current;

  // Weather bar fade-in when data arrives
  const weatherOpacity = useRef(new Animated.Value(0)).current;

  const pressIn = useCallback((scale: Animated.Value) => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, []);

  const pressOut = useCallback((scale: Animated.Value) => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, []);

  useEffect(() => {
    loadWeatherData();
    loadPlants();
    checkForSeasonChange();

    if (isFirstVisit) {
      setTimeout(() => {
        markAsReturningUser();
      }, 2000);
    }
  }, []);

  // Fade in weather bar when data is ready
  useEffect(() => {
    if (!weatherLoading) {
      Animated.timing(weatherOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      weatherOpacity.setValue(0);
    }
  }, [weatherLoading]);

  const checkForSeasonChange = async () => {
    try {
      const seasonChanged = await checkSeasonChange();

      if (seasonChanged) {
        const currentSeason = getDisplaySeason();
        const seasonNames: Record<string, { en: string; ar: string }> = {
          'Winter': { en: 'winter', ar: 'الشتاء' },
          'Spring': { en: 'spring', ar: 'الربيع' },
          'Summer': { en: 'summer', ar: 'الصيف' },
          'Autumn': { en: 'fall', ar: 'الخريف' }
        };
        const seasonName = seasonNames[currentSeason]?.en || 'spring';
        const seasonNameAr = seasonNames[currentSeason]?.ar || 'الربيع';

        const message = isRTL
          ? `تم تحديث نصائح العناية بالنباتات لفصل ${seasonNameAr} 🌿`
          : `Care tips updated for ${seasonName} 🌿`;
        const title = isRTL ? 'تغير الموسم' : 'Season Changed';

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

        const total = userPlants.length;
        const now = new Date();

        const needsWater = userPlants.filter(plant => {
          if (!plant.last_watered_at) return true;
          if (plant.next_watering_at) {
            const nextWateringDate = new Date(plant.next_watering_at);
            return now > nextWateringDate;
          }
          return false;
        }).length;

        const thriving = userPlants.filter(plant => {
          const hasGoodPlacement = plant.placement_score && plant.placement_score >= 3;
          const hasBeenWatered = !!plant.last_watered_at;
          const isNotOverdue = plant.next_watering_at
            ? now <= new Date(plant.next_watering_at)
            : true;
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
    if (showLoading) setWeatherLoading(true);
    try {
      const weatherData = await WeatherService.getCurrentWeather();
      if (weatherData) setWeather(weatherData);
      else logger.warn('No weather data received');
    } catch (error) {
      // Weather service handles fallback to mock data
    } finally {
      if (showLoading) setWeatherLoading(false);
    }
  };

  const toggleLanguage = async () => {
    const newLanguage = currentLanguage === 'en' ? 'ar' : 'en';
    try {
      await changeLanguage(newLanguage);
      setCurrentLanguage(newLanguage);
      setIsRTL(newLanguage === 'ar');
      const updatedWeather = await WeatherService.refreshForLanguageChange();
      if (updatedWeather) setWeather(updatedWeather);
    } catch (error) {
      logger.error('Error changing language:', error);
    }
  };

  // Care Tool Handlers
  const handleIdentify = () => {
    navigation.navigate('Camera');
  };

  const handleOrient = () => {
    if (plants.length > 0) {
      navigation.navigate('Plants');
    } else {
      Alert.alert(t('home.orient'), t('home.addPlantsFirst'));
    }
  };

  const handleWaterCalculator = () => {
    navigation.navigate('Plants');
  };

  const handleReminder = () => {
    if (plants.length > 0) {
      navigation.navigate('Plants');
    } else {
      Alert.alert(t('home.reminder'), t('home.noPlantsAdded'));
    }
  };

  const handleSearchPress = () => {
    navigation.navigate('Scan');
  };

  const rawName = user?.first_name || user?.name;
  const displayName = rawName && !rawName.includes('@') ? rawName : null;
  const namePart = displayName ? `${isRTL ? ' ' : ', '}${displayName}` : '';

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
        {/* 1. Compact Weather Bar */}
        {weatherLoading ? (
          <View style={[styles.weatherBar, isRTL && styles.weatherBarRTL]}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.weatherBarLocation}>{t('home.loadingWeather')}</Text>
          </View>
        ) : weather ? (
          <Animated.View style={{ opacity: weatherOpacity }}>
            <TouchableOpacity
              style={[styles.weatherBar, isRTL && styles.weatherBarRTL]}
              onPress={() => setIsWeatherModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.weatherBarLeft}>
                <Text style={styles.weatherBarTempText}>{weather.temperature}°C</Text>
                {weather.tempMin != null && weather.tempMax != null && (
                  <Text style={styles.weatherBarMinMax}>
                    {t('home.minTemp')}: {weather.tempMin}° / {t('home.maxTemp')}: {weather.tempMax}°
                  </Text>
                )}
              </View>
              <View style={styles.weatherBarCenter}>
                <Text style={styles.weatherBarLocation}>{weather.location}</Text>
                {weather.description && (
                  <Text style={styles.weatherBarCondition}>{weather.description}</Text>
                )}
              </View>
              <Text style={styles.weatherBarEmoji}>{getWeatherEmoji(weather.condition)}</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.weatherBar, isRTL && styles.weatherBarRTL, { opacity: weatherOpacity }]}>
            <Text style={styles.weatherBarLocation}>{t('home.weatherError')}</Text>
            <TouchableOpacity
              onPress={() => loadWeatherData()}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* 2. Header: Greeting + Language Toggle + Profile */}
        <View style={styles.header}>
          <View style={styles.greeting}>
            <Text style={styles.greetingText}>
              {isGuest || !user ? (
                <>
                  {t('home.guestWelcome')}! 👋
                </>
              ) : (
                isFirstVisit ? (
                  <>
                    {t('home.welcomeFirst')}{namePart}! 🫡
                  </>
                ) : (
                  <>
                    {t('home.welcomeBack')}{namePart}! 👋
                  </>
                )
              )}
            </Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={toggleLanguage}
              onPressIn={() => pressIn(scaleLanguage)}
              onPressOut={() => pressOut(scaleLanguage)}
              activeOpacity={1}
            >
              <Animated.View style={[styles.languageToggle, { transform: [{ scale: scaleLanguage }] }]}>
                <Text style={styles.languageToggleText}>
                  {currentLanguage === 'en' ? 'عربي' : 'EN'}
                </Text>
              </Animated.View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsAccountDrawerVisible(true)}
              onPressIn={() => pressIn(scaleProfile)}
              onPressOut={() => pressOut(scaleProfile)}
              activeOpacity={1}
            >
              <Animated.View style={[styles.profileButton, { transform: [{ scale: scaleProfile }] }]}>
                <Ionicons name="person-outline" size={20} color={COLORS.primary} />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Search Bar */}
        <View style={styles.searchSection}>
          <TouchableOpacity onPress={handleSearchPress} activeOpacity={0.8}>
            <View pointerEvents="none">
              <SearchBar
                value=""
                onChangeText={() => {}}
                placeholder={t('home.searchPlaceholder')}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* 4. Care Tools Grid (2x2) */}
        <View style={styles.careToolsSection}>
          <Text style={[styles.careToolsTitle, isRTL && { textAlign: 'right' }]}>
            {t('home.careTools')}
          </Text>

          {/* Row 1: Identify + Orient */}
          <View style={[styles.careToolsRow, isRTL && styles.careToolsRowRTL]}>
            <TouchableOpacity
              style={styles.careToolCardWrapper}
              onPress={handleIdentify}
              onPressIn={() => pressIn(scaleIdentify)}
              onPressOut={() => pressOut(scaleIdentify)}
              activeOpacity={1}
            >
              <Animated.View style={[styles.careToolCard, { transform: [{ scale: scaleIdentify }] }]}>
                <View style={styles.careToolIcon}>
                  <Ionicons name="camera-outline" size={22} color={COLORS.primary} />
                </View>
                <Text style={[styles.careToolTitle, isRTL && { textAlign: 'right' }]}>
                  {t('home.identify')}
                </Text>
                <Text style={[styles.careToolDesc, isRTL && { textAlign: 'right' }]}>
                  {t('home.identifyDesc')}
                </Text>
              </Animated.View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.careToolCardWrapper}
              onPress={handleOrient}
              onPressIn={() => pressIn(scaleOrient)}
              onPressOut={() => pressOut(scaleOrient)}
              activeOpacity={1}
            >
              <Animated.View style={[styles.careToolCard, { transform: [{ scale: scaleOrient }] }]}>
                <View style={styles.careToolIcon}>
                  <Ionicons name="compass-outline" size={22} color={COLORS.primary} />
                </View>
                <Text style={[styles.careToolTitle, isRTL && { textAlign: 'right' }]}>
                  {t('home.orient')}
                </Text>
                <Text style={[styles.careToolDesc, isRTL && { textAlign: 'right' }]}>
                  {t('home.orientDesc')}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Row 2: Water Calculator + Reminder */}
          <View style={[styles.careToolsRow, isRTL && styles.careToolsRowRTL]}>
            <TouchableOpacity
              style={styles.careToolCardWrapper}
              onPress={handleWaterCalculator}
              onPressIn={() => pressIn(scaleWater)}
              onPressOut={() => pressOut(scaleWater)}
              activeOpacity={1}
            >
              <Animated.View style={[styles.careToolCard, { transform: [{ scale: scaleWater }] }]}>
                <View style={styles.careToolIcon}>
                  <Ionicons name="water-outline" size={22} color={COLORS.primary} />
                </View>
                <Text style={[styles.careToolTitle, isRTL && { textAlign: 'right' }]}>
                  {t('home.waterCalculator')}
                </Text>
                <Text style={[styles.careToolDesc, isRTL && { textAlign: 'right' }]}>
                  {t('home.waterCalculatorDesc')}
                </Text>
              </Animated.View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.careToolCardWrapper}
              onPress={handleReminder}
              onPressIn={() => pressIn(scaleReminder)}
              onPressOut={() => pressOut(scaleReminder)}
              activeOpacity={1}
            >
              <Animated.View style={[styles.careToolCard, { transform: [{ scale: scaleReminder }] }]}>
                <View style={styles.careToolIcon}>
                  <Ionicons name="notifications-outline" size={22} color={COLORS.primary} />
                </View>
                <Text style={[styles.careToolTitle, isRTL && { textAlign: 'right' }]}>
                  {t('home.reminder')}
                </Text>
                <Text style={[styles.careToolDesc, isRTL && { textAlign: 'right' }]}>
                  {t('home.reminderDesc')}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Care Tracker - hidden for now */}

      </ScrollView>

      {/* Account Drawer */}
      <AccountDrawer
        visible={isAccountDrawerVisible}
        onClose={() => setIsAccountDrawerVisible(false)}
        userName={displayName ?? 'Guest'}
      />

      {/* Weather Tracker Modal */}
      <WeatherTrackerModal
        visible={isWeatherModalVisible}
        onClose={() => setIsWeatherModalVisible(false)}
        weather={weather}
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
    paddingBottom: 20,
    minHeight: '100%',
  },

  // ── Compact Weather Bar ──
  weatherBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: ELEMENT_SIZES.RADIUS_MD,
    paddingHorizontal: FIBONACCI.MD,
    paddingVertical: FIBONACCI.SM,
    marginHorizontal: FIBONACCI.MD,
    marginTop: FIBONACCI.SM,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  weatherBarRTL: {
    flexDirection: 'row-reverse',
  },
  weatherBarLeft: {
    alignItems: 'flex-start',
  },
  weatherBarTempText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: TYPOGRAPHY.XL,
    color: COLORS.primary,
  },
  weatherBarCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: FIBONACCI.SM,
  },
  weatherBarLocation: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.text,
    textAlign: 'center',
  },
  weatherBarCondition: {
    fontSize: TYPOGRAPHY.XS,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 1,
  },
  weatherBarEmoji: {
    fontSize: TYPOGRAPHY.XXL,
  },
  weatherBarMinMax: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: TYPOGRAPHY.XXS,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  retryButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: FIBONACCI.SM,
  },
  retryText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: FIBONACCI.LG,
    marginTop: FIBONACCI.LG,
    paddingBottom: 0,
  },
  greeting: {
    flex: 1,
  },
  greetingText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: TYPOGRAPHY.LG,
    color: '#4F7751',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: FIBONACCI.SM,
  },
  languageToggle: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: FIBONACCI.MD,
    paddingVertical: FIBONACCI.XS,
    borderRadius: ELEMENT_SIZES.RADIUS_MD,
    marginEnd: FIBONACCI.SM,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageToggleText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.XS,
    fontWeight: '600',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // ── Search Bar ──
  searchSection: {
    marginTop: FIBONACCI.MD,
    paddingHorizontal: FIBONACCI.MD,
  },

  // ── Care Tools Grid ──
  careToolsSection: {
    marginTop: FIBONACCI.LG,
    paddingHorizontal: FIBONACCI.MD,
  },
  careToolsTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: TYPOGRAPHY.MD,
    color: COLORS.primary,
    marginBottom: FIBONACCI.MD,
    textAlign: 'left',
  },
  careToolsRow: {
    flexDirection: 'row',
    gap: FIBONACCI.MD,
    marginBottom: FIBONACCI.MD,
  },
  careToolsRowRTL: {
    flexDirection: 'row-reverse',
  },
  careToolCardWrapper: {
    flex: 1,
  },
  careToolCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: ELEMENT_SIZES.RADIUS_MD,
    padding: FIBONACCI.MD,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  careToolIcon: {
    width: FIBONACCI.XL,
    height: FIBONACCI.XL,
    borderRadius: FIBONACCI.MD,
    backgroundColor: '#f0f7f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: FIBONACCI.SM,
  },
  careToolTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.text,
    marginBottom: FIBONACCI.XXS,
    textAlign: 'left',
  },
  careToolDesc: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: TYPOGRAPHY.XXS,
    color: COLORS.textSecondary,
    lineHeight: 14,
    textAlign: 'left',
    minHeight: 28,
  },

});
