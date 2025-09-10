import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import Text from '@/components/Text';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { Colors } from '@/constants';
import { usePlantStore } from '@/store/plantStore';
import { useCareEventStore } from '@/store/careEventStore'; // Import care event store
import { useLocalSearchParams, useRouter } from 'expo-router';

const PlantDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { plants, updatePlant, deletePlant, loading: plantLoading, error: plantError } = usePlantStore();
  const { careEvents, loading: careLoading, error: careError, fetchCareEvents, addCareEvent } = useCareEventStore();
  const [currentPlant, setCurrentPlant] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [nickname, setNickname] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [commonName, setCommonName] = useState('');
  const [location, setLocation] = useState('');
  const [windowDirection, setWindowDirection] = useState('');

  useEffect(() => {
    const plant = plants.find((p) => p.id === id);
    if (plant) {
      setCurrentPlant(plant);
      setNickname(plant.nickname);
      setScientificName(plant.scientific_name || '');
      setCommonName(plant.common_name || '');
      setLocation(plant.location || '');
      setWindowDirection(plant.window_direction || '');
      fetchCareEvents(plant.id); // Fetch care events for this plant
    } else {
      Alert.alert('Error', 'Plant not found.');
      router.back();
    }
  }, [id, plants, router, fetchCareEvents]);

  const handleUpdatePlant = async () => {
    if (!currentPlant) return;

    const updatedData = {
      id: currentPlant.id,
      nickname,
      scientific_name: scientificName || null,
      common_name: commonName || null,
      location: location || null,
      window_direction: windowDirection || null,
    };

    await updatePlant(updatedData);

    if (!plantError) {
      Alert.alert('Success', 'Plant updated successfully!');
      setIsEditing(false);
    } else {
      Alert.alert('Error', plantError || 'Failed to update plant.');
    }
  };

  const handleDeletePlant = async () => {
    if (!currentPlant) return;

    Alert.alert(
      'Delete Plant',
      `Are you sure you want to delete ${currentPlant.nickname}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePlant(currentPlant.id);
            if (!plantError) {
              Alert.alert('Success', 'Plant deleted successfully!');
              router.back(); // Go back to plants list
            } else {
              Alert.alert('Error', plantError || 'Failed to delete plant.');
            }
          },
        },
      ]
    );
  };

  const handleAddCareEvent = async (eventType: 'water' | 'prune' | 'feed') => {
    if (!currentPlant) return;

    const newCareEvent = {
      plant_id: currentPlant.id,
      event_type: eventType,
      event_date: new Date().toISOString(),
      notes: null,
    };

    await addCareEvent(newCareEvent);

    if (!careError) {
      Alert.alert('Success', `${eventType} event logged successfully!`);
      // Optionally update last_watered_at in plant store
      if (eventType === 'water') {
        await updatePlant({ id: currentPlant.id, last_watered_at: new Date().toISOString() });
      }
    } else {
      Alert.alert('Error', careError || `Failed to log ${eventType} event.`);
    }
  };

  if (!currentPlant) {
    return <Text>Loading plant details...</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{currentPlant.nickname}</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          <Text style={styles.editButton}>{isEditing ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Card style={styles.plantImageCard}>
          <Text style={{ fontSize: 64 }}>🪴</Text>
        </Card>

        {!isEditing && (
          <View style={styles.careActions}>
            <TouchableOpacity style={styles.careActionButton} onPress={() => handleAddCareEvent('water')}>
              <Text style={styles.careActionIcon}>💧</Text>
              <Text style={styles.careActionText}>Water</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.careActionButton} onPress={() => handleAddCareEvent('prune')}>
              <Text style={styles.careActionIcon}>✂️</Text>
              <Text style={styles.careActionText}>Prune</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.careActionButton} onPress={() => handleAddCareEvent('feed')}>
              <Text style={styles.careActionIcon}>🌱</Text>
              <Text style={styles.careActionText}>Feed</Text>
            </TouchableOpacity>
          </View>
        )}

        {isEditing ? (
          <View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Plant Nickname</Text>
              <Input value={nickname} onChangeText={setNickname} />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Scientific Name</Text>
              <Input value={scientificName} onChangeText={setScientificName} />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Common Name</Text>
              <Input value={commonName} onChangeText={setCommonName} />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Location</Text>
              <Input value={location} onChangeText={setLocation} />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Window Direction</Text>
              <Input value={windowDirection} onChangeText={setWindowDirection} />
            </View>
            <Button
              title={plantLoading ? 'Updating...' : 'Save Changes'}
              onPress={handleUpdatePlant}
              disabled={plantLoading}
              style={styles.saveButton}
            />
            <Button
              title={plantLoading ? 'Deleting...' : 'Delete Plant'}
              onPress={handleDeletePlant}
              disabled={plantLoading}
              variant="secondary"
              style={styles.deleteButton}
            />
          </View>
        ) : (
          <View>
            <Card style={styles.detailCard}>
              <Text style={styles.detailTitle}>Plant Info</Text>
              <Text style={styles.detailText}>Nickname: {currentPlant.nickname}</Text>
              <Text style={styles.detailText}>Scientific Name: {currentPlant.scientific_name || 'N/A'}</Text>
              <Text style={styles.detailText}>Common Name: {currentPlant.common_name || 'N/A'}</Text>
              <Text style={styles.detailText}>Location: {currentPlant.location || 'N/A'}</Text>
              <Text style={styles.detailText}>Window: {currentPlant.window_direction || 'N/A'}</Text>
              <Text style={styles.detailText}>Added: {new Date(currentPlant.added_at).toLocaleDateString()}</Text>
            </Card>

            <Card style={styles.detailCard}>
              <Text style={styles.detailTitle}>Care History</Text>
              {careLoading && <Text>Loading care history...</Text>}
              {careError && <Text style={{ color: 'red' }}>Error: {careError}</Text>}
              {!careLoading && careEvents.length === 0 && <Text>No care events logged yet.</Text>}
              {!careLoading && careEvents.length > 0 && (
                <View>
                  {careEvents.map((event: any) => (
                    <Text key={event.id} style={styles.careHistoryItem}>
                      • {new Date(event.event_date).toLocaleDateString()}: {event.event_type} {event.notes ? `(${event.notes})` : ''}
                    </Text>
                  ))}
                </View>
              )}
            </Card>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cairoSand,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.pureWhite,
    borderBottomWidth: 1,
    borderBottomColor: Colors.mediumGray,
  },
  backButton: {
    color: Colors.nileBlue,
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  editButton: {
    color: Colors.nileBlue,
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  plantImageCard: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
  },
  detailCard: {
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.lotusGreen,
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 5,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.lotusGreen,
    marginBottom: 8,
  },
  saveButton: {
    marginTop: 20,
  },
  deleteButton: {
    marginTop: 10,
    borderColor: Colors.critical,
    color: Colors.critical,
  },
  careActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  careActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: Colors.softGray,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  careActionIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  careActionText: {
    fontSize: 12,
    color: Colors.textPrimary,
  },
  careHistoryItem: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 5,
  },
});

export default PlantDetailScreen;