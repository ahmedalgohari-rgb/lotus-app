import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
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
import { Plant } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRTL } from '../utils/rtl';

export default function PlantsScreen() {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const isRTL = useRTL();

  const { plants, user, setPlants, deletePlant } = useStore();
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

      {/* Plant Grid */}
      <ScrollView 
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {plants.map((plant) => (
          <TouchableOpacity key={plant.id} style={styles.card} onPress={() => navigateToPlantDetail(plant)} onLongPress={() => handleDeletePlant(plant.id, plant.nickname)}>
            <Image source={{ uri: plant.image_url }} style={styles.image} />
            <Text style={[styles.plantName, isRTL && styles.plantNameRTL]}>{plant.nickname}</Text>
            <Text style={[styles.location, isRTL && styles.locationRTL]}>{getLocationLabel(plant.location)}</Text>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="water-outline" size={16} color="#3B82F6" />
                <Text style={styles.infoText}>{getDaysUntilWatering(plant.next_watering_at)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="navigate-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.infoText}>{plant.window_direction.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: getHealthColor(plant.health_status) }]} />
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 8,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: 12,
    width: '48%',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: FIBONACCI.HUGE,
    borderRadius: 8,
  },
  plantName: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    color: COLORS.text,
  },
  plantNameRTL: {
    textAlign: 'right',
  },
  location: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  locationRTL: {
    textAlign: 'right',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
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
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    width: '48%',
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