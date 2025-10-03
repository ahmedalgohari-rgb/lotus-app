import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { COLORS, PLANT_LOCATIONS, WINDOW_DIRECTIONS } from '../constants';
import { useStore } from '../store';
import { dbService } from '../services/supabase';
import { Plant } from '../types';

export default function PlantsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [todaysTasks, setTodaysTasks] = useState(0);
  
  const { plants, user, setPlants, deletePlant } = useStore();
  const navigation = useNavigation();

  useEffect(() => {
    loadPlants();
    calculateTodaysTasks();
  }, [user]);

  const loadPlants = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await dbService.getPlants(user.id);
      if (error) throw error;
      if (data) setPlants(data);
    } catch (error) {
      console.error('Error loading plants:', error);
    }
  };

  const calculateTodaysTasks = () => {
    const today = new Date();
    const tasksCount = plants.filter(plant => {
      if (!plant.next_watering_at) return false;
      const wateringDate = new Date(plant.next_watering_at);
      return wateringDate <= today;
    }).length;
    setTodaysTasks(tasksCount);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlants();
    calculateTodaysTasks();
    setRefreshing(false);
  };

  const handleDeletePlant = (plantId: string, plantName: string) => {
    Alert.alert(
      'Delete Plant',
      `Are you sure you want to delete "${plantName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await dbService.deletePlant(plantId);
              if (error) throw error;
              deletePlant(plantId);
            } catch (error) {
              console.error('Error deleting plant:', error);
              Alert.alert('Error', 'Failed to delete plant. Please try again.');
            }
          },
        },
      ]
    );
  };

  const navigateToPlantDetail = (plant: Plant) => {
    navigation.navigate('PlantDetail' as never, { plantId: plant.id } as never);
  };

  const navigateToAddPlant = () => {
    navigation.navigate('Scan' as never);
  };

  const getLocationLabel = (location: string) => {
    const found = PLANT_LOCATIONS.find(l => l.value === location);
    return found ? found.label : location;
  };

  const getWindowDirectionEmoji = (direction: string) => {
    const found = WINDOW_DIRECTIONS.find(d => d.value === direction);
    return found ? found.emoji : '🧭';
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return COLORS.success;
      case 'needs_attention': return COLORS.warning;
      case 'critical': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const getDaysUntilWatering = (nextWatering: string) => {
    const today = new Date();
    const wateringDate = new Date(nextWatering);
    const diffTime = wateringDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const waterAllPlants = async () => {
    const plantsNeedingWater = plants.filter(plant => {
      if (!plant.next_watering_at) return false;
      const wateringDate = new Date(plant.next_watering_at);
      return wateringDate <= new Date();
    });

    if (plantsNeedingWater.length === 0) {
      Alert.alert('No plants need watering right now! 🌿');
      return;
    }

    Alert.alert(
      'Water All Plants',
      `Water ${plantsNeedingWater.length} plants?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Water All',
          onPress: async () => {
            try {
              for (const plant of plantsNeedingWater) {
                const today = new Date().toISOString();
                // Calculate next watering (7 days default)
                const nextWatering = new Date();
                nextWatering.setDate(nextWatering.getDate() + 7);
                
                await dbService.updatePlant(plant.id, {
                  last_watered_at: today,
                  next_watering_at: nextWatering.toISOString(),
                });

                // Add care event
                await dbService.addCareEvent({
                  plant_id: plant.id,
                  user_id: user!.id,
                  event_type: 'water',
                  completed_at: today,
                });
              }
              
              await loadPlants();
              calculateTodaysTasks();
              Alert.alert('✅ All plants watered!');
            } catch (error) {
              console.error('Error watering plants:', error);
              Alert.alert('Error', 'Failed to update some plants.');
            }
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Please sign in to view your plants</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Plants</Text>
            <Text style={styles.headerSubtitle}>نباتاتي</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={navigateToAddPlant}>
            <Ionicons name="add" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Today's Tasks */}
        {todaysTasks > 0 && (
          <View style={styles.tasksCard}>
            <View style={styles.taskInfo}>
              <Text style={styles.taskIcon}>💧</Text>
              <Text style={styles.taskText}>
                {todaysTasks} plant{todaysTasks > 1 ? 's' : ''} need watering
              </Text>
            </View>
            <TouchableOpacity style={styles.waterAllButton} onPress={waterAllPlants}>
              <Text style={styles.waterAllText}>Water All</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Plants Grid */}
        {plants.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🌱</Text>
            <Text style={styles.emptyTitle}>No plants yet</Text>
            <Text style={styles.emptySubtitle}>لا توجد نباتات بعد</Text>
            <Text style={styles.emptyDescription}>
              Start by scanning your first plant with the camera
            </Text>
            <TouchableOpacity style={styles.scanButton} onPress={navigateToAddPlant}>
              <Ionicons name="camera-outline" size={20} color={COLORS.white} />
              <Text style={styles.scanButtonText}>Scan Your First Plant</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.plantsGrid}>
            {plants.map((plant) => (
              <TouchableOpacity
                key={plant.id}
                style={styles.plantCard}
                onPress={() => navigateToPlantDetail(plant)}
                onLongPress={() => handleDeletePlant(plant.id, plant.nickname)}
              >
                {plant.image_url ? (
                  <Image source={{ uri: plant.image_url }} style={styles.plantImage} />
                ) : (
                  <View style={styles.plantImagePlaceholder}>
                    <Text style={styles.plantImageEmoji}>🪴</Text>
                  </View>
                )}
                
                <View style={styles.plantInfo}>
                  <Text style={styles.plantName} numberOfLines={1}>
                    {plant.nickname}
                  </Text>
                  <Text style={styles.plantLocation} numberOfLines={1}>
                    {getLocationLabel(plant.location)}
                  </Text>
                  
                  <View style={styles.plantStatus}>
                    <View style={styles.statusItem}>
                      <Text style={styles.statusEmoji}>💧</Text>
                      <Text style={styles.statusText}>
                        {plant.next_watering_at ? (
                          (() => {
                            const days = getDaysUntilWatering(plant.next_watering_at);
                            if (days <= 0) return 'Now';
                            if (days === 1) return '1d';
                            return `${days}d`;
                          })()
                        ) : (
                          'Set'
                        )}
                      </Text>
                    </View>
                    
                    <View style={styles.statusItem}>
                      <Text style={styles.statusEmoji}>
                        {getWindowDirectionEmoji(plant.window_direction)}
                      </Text>
                      <Text style={styles.statusText}>
                        {plant.window_direction?.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    
                    <View style={[styles.healthIndicator, { backgroundColor: getHealthColor(plant.health_status) }]} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            
            {/* Add New Plant Card */}
            <TouchableOpacity style={styles.addPlantCard} onPress={navigateToAddPlant}>
              <View style={styles.addPlantContent}>
                <Ionicons name="add-circle-outline" size={48} color={COLORS.primary} />
                <Text style={styles.addPlantText}>Add New Plant</Text>
                <Text style={styles.addPlantTextAr}>أضف نبات جديد</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tasksCard: {
    backgroundColor: COLORS.secondary,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  taskText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  waterAllButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  waterAllText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  plantsGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  plantCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  plantImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  plantImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plantImageEmoji: {
    fontSize: 48,
  },
  plantInfo: {
    padding: 12,
  },
  plantName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  plantLocation: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  plantStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  healthIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  addPlantCard: {
    width: '48%',
    height: 200,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    backgroundColor: COLORS.white,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPlantContent: {
    alignItems: 'center',
  },
  addPlantText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 8,
  },
  addPlantTextAr: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  scanButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 20,
  },
});