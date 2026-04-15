import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { logger } from '../utils/logger';

import {
  COLORS,
  PLANT_LOCATIONS,
  FIBONACCI,
  TYPOGRAPHY,
} from '../constants';
import { useStore } from '../store';
import { dbService } from '../services/supabase';
import PlantImage from '../components/PlantImage';
import { Plant } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRTL } from '../utils/rtl';
import * as NotificationService from '../services/notifications';

export default function PlantsScreen() {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const isRTL = useRTL();

  const { plants, user, setPlants, deletePlant, gardenLocation } = useStore();
  const navigation = useNavigation();

  useEffect(() => {
    loadPlants();
  }, [user]);

  const loadPlants = async () => {
    if (!user) return;
    
    if (user.id.startsWith('guest-')) {
      return;
    }
    
    try {
      const { data, error } = await dbService.getPlants(user.id);
      if (error) throw error;
      if (data) setPlants(data);
    } catch (error) {
      logger.error('Error loading plants:', error);
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
    if (!nextWatering) return 'Set';
    const today = new Date();
    const wateringDate = new Date(nextWatering);
    const diffTime = wateringDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Now';
    if (diffDays === 1) return '1d';
    return `${diffDays}d`;
  };
  
  const calculateHealthStatus = (plant: Plant): 'healthy' | 'needs_attention' | 'critical' => {
    const placementScore = plant.placement_score || 0;
    const hasBeenWatered = !!plant.last_watered_at; // Plant MUST have been watered before
    const isWateringOverdue = plant.next_watering_at
      ? new Date(plant.next_watering_at) < new Date()
      : false;

    // 🔴 CRITICAL: Poor placement (< 3 stars) - takes priority
    if (placementScore < 3) {
      return 'critical';
    }

    // 🟢 HEALTHY (THRIVING): Good placement (>= 3) AND has been watered AND on schedule
    // A plant CANNOT be thriving if it's never been watered!
    if (placementScore >= 3 && hasBeenWatered && !isWateringOverdue) {
      return 'healthy';
    }

    // 🟡 NEEDS ATTENTION: Everything else
    // - Never watered (even with good placement >= 3)
    // - Good placement but overdue for watering
    // - Any other case
    return 'needs_attention';
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return COLORS.success;
      case 'needs_attention': return COLORS.warning;
      case 'critical': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={[{fontSize: 18, color: COLORS.textSecondary}, isRTL && {textAlign: 'right'}]}>{t('plants.signInRequired')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <Text style={[styles.title, isRTL && styles.titleRTL]}>{t('plants.myGarden')}</Text>
        <TouchableOpacity onPress={navigateToAddPlant}>
          <Ionicons name="add-circle-outline" size={32} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Garden Location Pill */}
      {gardenLocation && (
        <View style={[styles.gardenPill, isRTL && styles.gardenPillRTL]}>
          <Ionicons name="location" size={14} color={COLORS.primary} />
          <Text style={styles.gardenPillText}>
            {t('gardenLocation.myGarden')}: {gardenLocation.name}
          </Text>
        </View>
      )}

      {/* Plant Grid */}
      <ScrollView
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentInset={{ bottom: 0 }}
        contentInsetAdjustmentBehavior="never"
      >
        {plants.map((plant) => (
          <TouchableOpacity key={plant.id} style={styles.card} onPress={() => navigateToPlantDetail(plant)} onLongPress={() => handleDeletePlant(plant.id, plant.nickname)}>
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
        ))}

        {/* Add Plant Card */}
        <TouchableOpacity style={styles.addCard} onPress={navigateToAddPlant}>
          <View style={styles.addCircle}>
            <Ionicons name="add" size={36} color={COLORS.primary} />
          </View>
          <Text style={[styles.addText, isRTL && styles.addTextRTL]}>{t('plants.addPlant')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 16,
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
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 4,
    gap: 4,
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
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', // Distribute cards evenly (automatic gap)
    paddingHorizontal: FIBONACCI.SM, // 8px - Fibonacci side margins
    paddingTop: FIBONACCI.SM, // 8px - Fibonacci top margin
    paddingBottom: FIBONACCI.SM, // 8px - Minimal bottom padding
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: FIBONACCI.MD, // 13px - Fibonacci border radius
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: FIBONACCI.SM, // 8px - Fibonacci padding (tighter cards, more photo-focused)
    width: '48%', // 48% width with space-between = automatic balanced gaps
    marginBottom: FIBONACCI.MD, // 13px - Fibonacci vertical spacing
    alignItems: 'center', // Center all content horizontally for balanced composition
  },
  imageWrapper: {
    width: '100%',
    alignItems: 'center', // Center image within wrapper for balanced card layout
  },
  image: {
    // size prop handles dimensions (144×144 via FIBONACCI.HUGE)
    borderRadius: FIBONACCI.SM, // 8px
  },
  textBlock: {
    width: FIBONACCI.HUGE, // 144px - same as photo width
    alignSelf: 'center', // Center the text block within card
    marginTop: FIBONACCI.MD, // 13px gap between image and text
  },
  plantName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'left', // Left-align for better readability
  },
  plantNameRTL: {
    textAlign: 'right', // Right-align for RTL languages
  },
  location: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'left', // Left-align for consistency
  },
  locationRTL: {
    textAlign: 'right', // Right-align for RTL languages
  },
  infoRowWrapper: {
    width: '100%',
    alignItems: 'center', // Center the infoRow horizontally within card
    marginTop: 6,
  },
  infoRow: {
    width: FIBONACCI.HUGE, // 144px - same as photo width for visual alignment
    flexDirection: 'row',
    justifyContent: 'space-between', // Distribute: Left (water) | Center (orientation) | Right (health)
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  addCard: {
    backgroundColor: '#E8F5E9', // accentGreen
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    borderWidth: 2,
    borderRadius: FIBONACCI.MD, // 13px - Fibonacci border radius (matches plant cards)
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: FIBONACCI.LG, // 21px - Fibonacci vertical padding
    width: '48%', // Match plant card width
  },
  addCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 8,
  },
  addTextRTL: {
    textAlign: 'center',
  },
});