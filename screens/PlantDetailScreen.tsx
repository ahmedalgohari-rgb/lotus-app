import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { COLORS, PLANT_LOCATIONS, WINDOW_DIRECTIONS, CARE_EVENT_TYPES } from '../constants';
import { useStore } from '../store';
import { dbService } from '../services/supabase';
import { Plant, CareEvent } from '../types';

interface RouteParams {
  plantId: string;
}

export default function PlantDetailScreen() {
  const [plant, setPlant] = useState<Plant | null>(null);
  const [careHistory, setCareHistory] = useState<CareEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigation = useNavigation();
  const route = useRoute();
  const { plantId } = route.params as RouteParams;
  const { plants, updatePlant, user } = useStore();

  useEffect(() => {
    loadPlantDetails();
    loadCareHistory();
  }, [plantId]);

  const loadPlantDetails = () => {
    const foundPlant = plants.find(p => p.id === plantId);
    if (foundPlant) {
      setPlant(foundPlant);
    }
    setIsLoading(false);
  };

  const loadCareHistory = async () => {
    try {
      const { data, error } = await dbService.getCareEvents(plantId);
      if (error) throw error;
      if (data) setCareHistory(data);
    } catch (error) {
      console.error('Error loading care history:', error);
    }
  };

  const handleCareAction = async (eventType: 'water' | 'fertilize' | 'prune' | 'repot') => {
    if (!plant || !user) return;

    try {
      const now = new Date().toISOString();
      
      // Add care event
      await dbService.addCareEvent({
        plant_id: plant.id,
        user_id: user.id,
        event_type: eventType,
        completed_at: now,
      });

      // Update plant if watering
      if (eventType === 'water') {
        const nextWatering = new Date();
        nextWatering.setDate(nextWatering.getDate() + 7); // Default 7 days
        
        const updatedPlant = {
          ...plant,
          last_watered_at: now,
          next_watering_at: nextWatering.toISOString(),
        };

        await dbService.updatePlant(plant.id, {
          last_watered_at: now,
          next_watering_at: nextWatering.toISOString(),
        });

        updatePlant(plant.id, updatedPlant);
        setPlant(updatedPlant);
      }

      // Refresh care history
      await loadCareHistory();

      const actionName = CARE_EVENT_TYPES.find(c => c.value === eventType)?.label || eventType;
      Alert.alert('✅ Done!', `${actionName} completed for ${plant.nickname}`);
    } catch (error) {
      console.error('Error recording care action:', error);
      Alert.alert('Error', 'Failed to record care action. Please try again.');
    }
  };

  const getLocationLabel = (location: string) => {
    const found = PLANT_LOCATIONS.find(l => l.value === location);
    return found ? found.label : location;
  };

  const getDirectionLabel = (direction: string) => {
    const found = WINDOW_DIRECTIONS.find(d => d.value === direction);
    return found ? found.label : direction;
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return COLORS.success;
      case 'needs_attention': return COLORS.warning;
      case 'critical': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const getDaysUntilWatering = () => {
    if (!plant?.next_watering_at) return null;
    const today = new Date();
    const wateringDate = new Date(plant.next_watering_at);
    const diffTime = wateringDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (isLoading || !plant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading plant details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const daysUntilWatering = getDaysUntilWatering();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{plant.nickname}</Text>
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Plant Image */}
        <View style={styles.imageContainer}>
          {plant.image_url ? (
            <Image source={{ uri: plant.image_url }} style={styles.plantImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderEmoji}>🪴</Text>
            </View>
          )}
          
          <View style={[styles.healthBadge, { backgroundColor: getHealthColor(plant.health_status) }]}>
            <Text style={styles.healthBadgeText}>
              {plant.health_status === 'healthy' && 'Healthy'}
              {plant.health_status === 'needs_attention' && 'Needs Care'}
              {plant.health_status === 'critical' && 'Critical'}
            </Text>
          </View>
        </View>

        {/* Plant Info */}
        <View style={styles.content}>
          <Text style={styles.plantName}>{plant.nickname}</Text>
          <Text style={styles.plantSubtitle}>
            {getLocationLabel(plant.location)} • {getDirectionLabel(plant.window_direction)} window
          </Text>

          {/* Quick Actions */}
          <View style={styles.actionsContainer}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleCareAction('water')}
              >
                <Text style={styles.actionIcon}>💧</Text>
                <Text style={styles.actionText}>Water</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleCareAction('fertilize')}
              >
                <Text style={styles.actionIcon}>🌱</Text>
                <Text style={styles.actionText}>Feed</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleCareAction('prune')}
              >
                <Text style={styles.actionIcon}>✂️</Text>
                <Text style={styles.actionText}>Prune</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleCareAction('repot')}
              >
                <Text style={styles.actionIcon}>🪴</Text>
                <Text style={styles.actionText}>Repot</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Care Schedule */}
          <View style={styles.scheduleContainer}>
            <Text style={styles.sectionTitle}>Care Schedule</Text>
            <View style={styles.scheduleCard}>
              <View style={styles.scheduleItem}>
                <Text style={styles.scheduleLabel}>Last watered:</Text>
                <Text style={styles.scheduleValue}>
                  {plant.last_watered_at ? formatDate(plant.last_watered_at) : 'Never'}
                </Text>
              </View>
              
              <View style={styles.scheduleItem}>
                <Text style={styles.scheduleLabel}>Next watering:</Text>
                <Text style={[
                  styles.scheduleValue,
                  daysUntilWatering !== null && daysUntilWatering <= 0 && styles.scheduleOverdue
                ]}>
                  {daysUntilWatering !== null ? (
                    daysUntilWatering <= 0 ? 'Now!' :
                    daysUntilWatering === 1 ? 'Tomorrow' :
                    `In ${daysUntilWatering} days`
                  ) : (
                    'Not set'
                  )}
                </Text>
              </View>

              {/* Progress Dots */}
              <View style={styles.progressContainer}>
                <View style={styles.progressDots}>
                  {[...Array(7)].map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.progressDot,
                        index < (7 - (daysUntilWatering || 0)) && styles.progressDotActive
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.progressLabel}>Watering cycle</Text>
              </View>
            </View>
          </View>

          {/* Plant Details */}
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>Plant Details</Text>
            
            <View style={styles.detailCard}>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>📍</Text>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{getLocationLabel(plant.location)}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>🧭</Text>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Window</Text>
                  <Text style={styles.detailValue}>{getDirectionLabel(plant.window_direction)}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>📅</Text>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Added</Text>
                  <Text style={styles.detailValue}>{formatDate(plant.created_at)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Care History */}
          <View style={styles.historyContainer}>
            <Text style={styles.sectionTitle}>Care History</Text>
            
            {careHistory.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Text style={styles.emptyHistoryText}>No care events yet</Text>
                <Text style={styles.emptyHistorySubtext}>
                  Start caring for your plant to build a history
                </Text>
              </View>
            ) : (
              <View style={styles.historyList}>
                {careHistory.slice(0, 10).map((event) => {
                  const eventType = CARE_EVENT_TYPES.find(c => c.value === event.event_type);
                  return (
                    <View key={event.id} style={styles.historyItem}>
                      <Text style={styles.historyIcon}>{eventType?.emoji || '•'}</Text>
                      <View style={styles.historyContent}>
                        <Text style={styles.historyText}>
                          {eventType?.label || event.event_type} completed
                        </Text>
                        <Text style={styles.historyDate}>
                          {formatDate(event.completed_at)} at {formatTime(event.completed_at)}
                        </Text>
                      </View>
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  plantImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderEmoji: {
    fontSize: 80,
  },
  healthBadge: {
    position: 'absolute',
    top: 100,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  healthBadgeText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  plantName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  plantSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 32,
  },
  actionsContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    fontSize: 24,
    fontFamily: 'Helvetica',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  scheduleContainer: {
    marginBottom: 32,
  },
  scheduleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  scheduleValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  scheduleOverdue: {
    color: COLORS.error,
  },
  progressContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  detailsContainer: {
    marginBottom: 32,
  },
  detailCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 20,
    marginRight: 16,
    fontFamily: 'Helvetica',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  historyContainer: {
    marginBottom: 32,
  },
  emptyHistory: {
    backgroundColor: COLORS.background,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
  },
  historyIcon: {
    fontSize: 20,
    marginRight: 16,
    fontFamily: 'Helvetica',
  },
  historyContent: {
    flex: 1,
  },
  historyText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  bottomPadding: {
    height: 40,
  },
});