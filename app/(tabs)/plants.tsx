import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { usePlantStore } from '@/store/plantStore';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants';
import { logger } from '@/utils/logger';

export default function MyPlantsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { plants = [], loading = false, fetchPlants } = usePlantStore();
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => {
    // Safe fetch with error handling
    const loadPlants = async () => {
      try {
        if (user?.id) {
          await fetchPlants();
        }
      } catch (error) {
        logger.error('Failed to load plants', error);
      }
    };
    loadPlants();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPlants();
    } catch (error) {
      logger.error('Plant refresh failed', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddPlant = () => {
    router.push('/scan');
  };

  const handlePlantPress = (plant: any) => {
    // Navigate to plant details or show info
    logger.info('Plant selected', { plantName: plant.nickname || plant.common_name });
  };

  // Loading state
  if (loading && plants.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your plants...</Text>
      </View>
    );
  }

  // Empty state for new users
  if (!loading && (!plants || plants.length === 0)) {
    return (
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.emptyContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="leaf-outline" size={80} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Plants Yet!</Text>
          <Text style={styles.emptySubtitle}>
            Start your plant journey by adding your first plant
          </Text>
          <TouchableOpacity 
            style={styles.addFirstPlantButton}
            onPress={() => router.push('/scan')}
          >
            <Ionicons name="camera" size={24} color="white" />
            <Text style={styles.buttonText}>Scan Your First Plant</Text>
          </TouchableOpacity>
          
          {/* Quick tips for new users */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Quick Tips:</Text>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.secondary} />
              <Text style={styles.tipText}>Use the camera to identify plants instantly</Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.secondary} />
              <Text style={styles.tipText}>Get personalized care instructions</Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.secondary} />
              <Text style={styles.tipText}>Set watering reminders</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Render plants list (existing code)
  return (
    <ScrollView 
      style={styles.scrollContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Your existing plant list rendering code here */}
      {plants.map((plant) => (
        <TouchableOpacity key={plant.id} style={styles.plantCard} onPress={() => handlePlantPress(plant)}>
          <View style={styles.plantHeader}>
            <View style={styles.plantImagePlaceholder}>
              <Ionicons name="leaf" size={24} color={Colors.primary} />
            </View>
            <View style={styles.plantInfo}>
              <Text style={styles.plantName} numberOfLines={1}>
                {plant.nickname || plant.common_name}
              </Text>
              {plant.scientific_name && (
                <Text style={styles.plantSpecies} numberOfLines={1}>
                  {plant.scientific_name}
                </Text>
              )}
              {plant.location && (
                <Text style={styles.plantLocation} numberOfLines={1}>
                  📍 {plant.location}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.body,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyIconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: Typography.h2,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  addFirstPlantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: 'white',
    fontSize: Typography.body,
    fontWeight: '600',
  },
  tipsContainer: {
    marginTop: Spacing.xxl,
    padding: Spacing.lg,
    backgroundColor: 'white',
    borderRadius: BorderRadius.md,
    width: '100%',
  },
  tipsTitle: {
    fontSize: Typography.body,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: Typography.small,
    color: Colors.textSecondary,
  },
  plantCard: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  plantHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  plantImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  plantInfo: {
    flex: 1,
  },
  plantName: {
    fontSize: Typography.body,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  plantSpecies: {
    fontSize: Typography.small,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  plantLocation: {
    fontSize: Typography.small,
    color: Colors.textSecondary,
  },
});