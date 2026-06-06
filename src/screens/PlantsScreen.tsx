import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';
import { calculateHealthStatus, getHealthColor } from '../utils/plantHealth';

import {
  COLORS,
  PLANT_LOCATIONS,
  FIBONACCI,
  TYPOGRAPHY,
  ELEMENT_SIZES,
} from '../constants';
import { useStore } from '../store';
import { dbService } from '../services/supabase';
import PlantImage from '../components/PlantImage';
import GardenLocationModal from '../components/GardenLocationModal';
import { Plant } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRTL } from '../utils/rtl';
import * as NotificationService from '../services/notifications';

// ---------------------------------------------------------------------------
// AnimatedPlantCard
// Handles stagger fade-in (opacity + translateY) and press scale feedback.
// ---------------------------------------------------------------------------
interface AnimatedPlantCardProps {
  plant: Plant;
  index: number;
  onPress: () => void;
  onLongPress: () => void;
  isRTL: boolean;
  getLocationLabel: (location: string) => string;
  getDaysUntilWatering: (nextWatering?: string) => string;
}

function AnimatedPlantCard({
  plant,
  index,
  onPress,
  onLongPress,
  isRTL,
  getLocationLabel,
  getDaysUntilWatering,
}: AnimatedPlantCardProps) {
  const enterAnim = useRef(new Animated.Value(0)).current; // 0 = invisible/shifted
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(enterAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  const opacity = enterAnim;
  const translateY = enterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale: scaleAnim }], width: '48%' }}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.imageWrapper}>
          <PlantImage
            plantId={plant.plant_id}
            imageUrl={plant.image_url}
            capturedImageUri={plant.captured_image_uri}
            plantName={plant.nickname}
            size={FIBONACCI.HUGE}
            style={styles.image}
          />
        </View>
        <View style={styles.textBlock}>
          <Text style={[styles.plantName, isRTL && styles.plantNameRTL]}>{plant.nickname}</Text>
          <Text style={[styles.location, isRTL && styles.locationRTL]}>{getLocationLabel(plant.location)}</Text>
        </View>

        <View style={styles.infoRowWrapper}>
          <View style={styles.infoRow}>
            {/* Left: Watering */}
            <View style={styles.infoItem}>
              <Ionicons name="water-outline" size={16} color="#3B82F6" />
              <Text style={styles.infoText}>{getDaysUntilWatering(plant.next_watering_at)}</Text>
            </View>

            {/* Center: Orientation */}
            <View style={styles.infoItem}>
              <Ionicons name="navigate-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{plant.window_direction.charAt(0).toUpperCase()}</Text>
            </View>

            {/* Right: Health Indicator */}
            <View style={[styles.statusDot, { backgroundColor: getHealthColor(calculateHealthStatus(plant)) }]} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// AnimatedAddCard
// Press scale feedback on the dashed "Add Plant" card.
// ---------------------------------------------------------------------------
interface AnimatedAddCardProps {
  onPress: () => void;
  isRTL: boolean;
  label: string;
  // Stagger after last plant card
  index: number;
}

function AnimatedAddCard({ onPress, isRTL, label, index }: AnimatedAddCardProps) {
  const enterAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(enterAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  };

  const opacity = enterAnim;
  const translateY = enterAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale: scaleAnim }], width: '48%' }}>
      <TouchableOpacity
        style={styles.addCard}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.addCircle}>
          <Ionicons name="add" size={36} color={COLORS.primary} />
        </View>
        <Text style={[styles.addText, isRTL && styles.addTextRTL]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// EmptyState
// Shown when a signed-in user has no plants yet. Gentle pulse on the icon.
// ---------------------------------------------------------------------------
function EmptyState({ isRTL, onAddPress, t }: { isRTL: boolean; onAddPress: () => void; t: (key: string) => string }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade the whole empty state in
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    // Slow pulse on the leaf icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.emptyContainer, { opacity: fadeIn }]}>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Ionicons name="leaf-outline" size={72} color={COLORS.primary} style={{ opacity: 0.35 }} />
      </Animated.View>
      <Text style={[styles.emptyTitle, isRTL && { textAlign: 'right' }]}>
        {t('plants.noPlantsTitle')}
      </Text>
      <Text style={[styles.emptySubtitle, isRTL && { textAlign: 'right' }]}>
        {t('plants.noPlantsSubtitle')}
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={onAddPress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="add" size={18} color={COLORS.white} />
        <Text style={styles.emptyButtonText}>{t('plants.addPlant')}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// PlantsScreen
// ---------------------------------------------------------------------------
export default function PlantsScreen() {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const isRTL = useRTL();

  const { plants, user, setPlants, deletePlant, gardenLocation, setGardenLocation } = useStore();
  const navigation = useNavigation();
  const [showGardenLocationPrompt, setShowGardenLocationPrompt] = useState(false);

  useEffect(() => {
    loadPlants();
  }, [user]);

  // Show the garden location prompt when this tab is opened, if conditions are met.
  // This replaces the old launch-time trigger so the prompt's "save your location"
  // ask happens in-context, on the My Garden screen the user is actually looking at.
  useFocusEffect(
    useCallback(() => {
      const checkGardenPrompt = async () => {
        if (!user || user.id.startsWith('guest-')) return;
        if (gardenLocation) return;
        if (plants.length < 3) return;
        const promptShown = await AsyncStorage.getItem('garden_location_prompt_shown');
        if (!promptShown) {
          setShowGardenLocationPrompt(true);
        }
      };
      checkGardenPrompt();
    }, [user, gardenLocation, plants.length])
  );

  const handleGardenLocationSave = async (location: { lat: number; lon: number; name: string }) => {
    setShowGardenLocationPrompt(false);
    setGardenLocation(location);
    if (user) {
      await dbService.updateProfile(user.id, {
        garden_lat: location.lat,
        garden_lon: location.lon,
        garden_name: location.name,
      });
    }
    await AsyncStorage.setItem('garden_location_prompt_shown', 'true');
  };

  const handleGardenLocationSkip = async () => {
    setShowGardenLocationPrompt(false);
    await AsyncStorage.setItem('garden_location_prompt_shown', 'true');
  };

  const loadPlants = async () => {
    if (!user) return;

    if (user.id.startsWith('guest-')) {
      return;
    }

    try {
      const { data, error } = await dbService.getPlants(user.id);
      if (error) throw error;
      if (data) setPlants(data);
      setLoadError(false);
    } catch (error) {
      logger.error('Error loading plants:', error);
      setLoadError(true);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlants();
    setRefreshing(false);
  };

  const handleDeletePlant = (plantId: string, plantName: string) => {
    Alert.alert(
      t('plantDetail.deletePlant'),
      t('plantDetail.confirmDelete'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              if (user && user.id.startsWith('guest-')) {
                deletePlant(plantId);
                return;
              }

              const { error } = await dbService.deletePlant(plantId);
              if (error) throw error;
              deletePlant(plantId);
              NotificationService.cancelForPlant(plantId);
            } catch (error) {
              logger.error('Error deleting plant:', error);
              Alert.alert(t('common.error'), t('errors.saveError'));
            }
          },
        },
      ]
    );
  };

  const navigateToPlantDetail = (plant: Plant) => {
    navigation.navigate('PlantDetail', { plantId: plant.id });
  };

  const navigateToAddPlant = () => {
    navigation.navigate('Scan');
  };

  const getLocationLabel = (location: string) => {
    const found = PLANT_LOCATIONS.find(l => l.value === location);
    return found ? found.label : location;
  };

  const getDaysUntilWatering = (nextWatering?: string) => {
    if (!nextWatering) return t('plants.wateringSet');
    const today = new Date();
    const wateringDate = new Date(nextWatering);
    const diffTime = wateringDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return t('plants.wateringNow');
    return t('plants.wateringDayShort', { count: diffDays });
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={[{ fontSize: 18, color: COLORS.textSecondary }, isRTL && { textAlign: 'right' }]}>
            {t('plants.signInRequired')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (user.id.startsWith('guest-')) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, isRTL && styles.headerRTL]}>
          <Text style={[styles.title, isRTL && styles.titleRTL]}>{t('plants.myGarden')}</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 34 }}>
          <Ionicons name="leaf-outline" size={72} color={COLORS.primary} style={{ opacity: 0.35, marginBottom: 21 }} />
          <Text style={[styles.emptyTitle, { textAlign: 'center' }]}>{t('plants.guestTitle')}</Text>
          <Text style={[styles.emptySubtitle, { textAlign: 'center' }]}>{t('plants.guestSubtitle')}</Text>
          <TouchableOpacity
            style={[styles.emptyButton, { marginTop: 21 }]}
            onPress={() => navigation.navigate('Auth')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="person-outline" size={18} color={COLORS.white} />
            <Text style={styles.emptyButtonText}>{t('plants.guestSignIn')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <Text style={[styles.title, isRTL && styles.titleRTL]}>{t('plants.myGarden')}</Text>
        {/* hitSlop ensures the 32px icon has a 44px touch target */}
        <TouchableOpacity
          onPress={navigateToAddPlant}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="add-circle-outline" size={32} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Garden Location Pill */}
      {gardenLocation && (
        <View style={[styles.gardenPill, isRTL && styles.gardenPillRTL]}>
          <Ionicons name="location" size={14} color={COLORS.primary} />
          <Text style={styles.gardenPillText}>{gardenLocation.name}</Text>
        </View>
      )}

      {/* Plant Grid */}
      <ScrollView
        contentContainerStyle={plants.length === 0 ? styles.gridEmpty : styles.grid}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentInset={{ bottom: 0 }}
        contentInsetAdjustmentBehavior="never"
      >
        {plants.length === 0 && loadError ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cloud-offline-outline" size={72} color={COLORS.error} style={{ opacity: 0.5 }} />
            <Text style={[styles.emptyTitle, isRTL && { textAlign: 'right' }]}>
              {t('plants.loadErrorTitle')}
            </Text>
            <Text style={[styles.emptySubtitle, isRTL && { textAlign: 'right' }]}>
              {t('plants.loadErrorSubtitle')}
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={loadPlants}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="refresh" size={18} color={COLORS.white} />
              <Text style={styles.emptyButtonText}>{t('plants.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : plants.length === 0 ? (
          <EmptyState isRTL={isRTL} onAddPress={navigateToAddPlant} t={t} />
        ) : (
          <>
            {plants.map((plant, index) => (
              <AnimatedPlantCard
                key={plant.id}
                plant={plant}
                index={index}
                onPress={() => navigateToPlantDetail(plant)}
                onLongPress={() => handleDeletePlant(plant.id, plant.nickname)}
                isRTL={isRTL}
                getLocationLabel={getLocationLabel}
                getDaysUntilWatering={getDaysUntilWatering}
              />
            ))}

            {/* Add Plant Card — staggered after the last plant */}
            <AnimatedAddCard
              onPress={navigateToAddPlant}
              isRTL={isRTL}
              label={t('plants.addPlant')}
              index={plants.length}
            />
          </>
        )}
      </ScrollView>

      <GardenLocationModal
        visible={showGardenLocationPrompt}
        onSave={handleGardenLocationSave}
        onSkip={handleGardenLocationSkip}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: FIBONACCI.MD,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  title: {
    fontSize: TYPOGRAPHY.XL,
    fontWeight: '700',
    color: COLORS.primary,
  },
  titleRTL: {
    textAlign: 'right',
  },
  gardenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: FIBONACCI.MD,
    paddingVertical: FIBONACCI.XS,
    paddingHorizontal: FIBONACCI.MD,
    marginHorizontal: FIBONACCI.MD,
    marginBottom: FIBONACCI.XXS,
    gap: FIBONACCI.XXS,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  gardenPillRTL: {
    flexDirection: 'row-reverse',
    alignSelf: 'flex-end',
  },
  gardenPillText: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.primary,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: FIBONACCI.SM,
    paddingTop: FIBONACCI.SM,
    paddingBottom: FIBONACCI.SM,
  },
  gridEmpty: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: FIBONACCI.MD,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: FIBONACCI.SM,
    // width is set on the Animated.View wrapper (48%)
    marginBottom: FIBONACCI.MD,
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  image: {
    borderRadius: FIBONACCI.SM,
  },
  textBlock: {
    width: FIBONACCI.HUGE,
    alignSelf: 'center',
    marginTop: FIBONACCI.MD,
  },
  plantName: {
    fontSize: TYPOGRAPHY.BASE,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'left',
  },
  plantNameRTL: {
    textAlign: 'right',
  },
  location: {
    fontSize: TYPOGRAPHY.XS,
    color: COLORS.textSecondary,
    textAlign: 'left',
  },
  locationRTL: {
    textAlign: 'right',
  },
  infoRowWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: FIBONACCI.XS,
  },
  infoRow: {
    width: FIBONACCI.HUGE,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: TYPOGRAPHY.XS,
    color: COLORS.textSecondary,
    marginStart: FIBONACCI.XXS,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  addCard: {
    backgroundColor: '#E8F5E9',
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    borderWidth: 2,
    borderRadius: FIBONACCI.MD,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: FIBONACCI.LG,
    // width is set on the Animated.View wrapper (48%)
  },
  addCircle: {
    width: FIBONACCI.XXL,
    height: FIBONACCI.XXL,
    borderRadius: FIBONACCI.XXL / 2,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: FIBONACCI.SM,
  },
  addTextRTL: {
    textAlign: 'center',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: FIBONACCI.XL,
    paddingBottom: FIBONACCI.XXL,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.LG,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: FIBONACCI.LG,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.textSecondary,
    marginTop: FIBONACCI.SM,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: FIBONACCI.MD,
    paddingVertical: FIBONACCI.SM,
    paddingHorizontal: FIBONACCI.LG,
    marginTop: FIBONACCI.XL,
    gap: FIBONACCI.XS,
    minHeight: 44,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: TYPOGRAPHY.BASE,
  },
});
