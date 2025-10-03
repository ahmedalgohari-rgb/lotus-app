import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { COLORS, PLANT_LOCATIONS, WINDOW_DIRECTIONS } from '../constants';
import { useStore } from '../store';
import { dbService } from '../services/supabase';
import { IdentificationResult } from '../types';

interface RouteParams {
  identificationResult?: IdentificationResult;
  capturedImage?: string;
}

export default function AddPlantScreen() {
  const [nickname, setNickname] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('living_room');
  const [selectedDirection, setSelectedDirection] = useState('east');
  const [isLoading, setIsLoading] = useState(false);

  const navigation = useNavigation();
  const route = useRoute();
  const { identificationResult, capturedImage } = (route.params as RouteParams) || {};
  const { user, addPlant } = useStore();

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to save plants');
      return;
    }

    if (!nickname.trim()) {
      Alert.alert('Error', 'Please enter a nickname for your plant');
      return;
    }

    setIsLoading(true);

    try {
      let imageUrl = '';
      
      if (capturedImage) {
        try {
          imageUrl = await dbService.uploadImage({
            uri: capturedImage,
            type: 'image/jpeg',
            name: `plant-${Date.now()}.jpg`,
          });
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          Alert.alert('Image Upload Failed', 'The plant data will be saved without the image.');
        }
      }

      // Calculate next watering date (default 7 days)
      const nextWatering = new Date();
      nextWatering.setDate(nextWatering.getDate() + 7);

      const newPlant = {
        user_id: user.id,
        nickname: nickname.trim(),
        location: selectedLocation,
        window_direction: selectedDirection,
        image_url: imageUrl,
        // health_status: 'healthy' as const, // TODO: Add health_status column to plants table
        next_watering_at: nextWatering.toISOString(),
      };

      const { data, error } = await dbService.addPlant(newPlant);
      
      if (error) throw error;
      if (data) {
        addPlant(data);
        Alert.alert(
          'Plant Added! 🌿',
          `${nickname} has been added to your garden`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Plants' as never),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error saving plant:', error);
      Alert.alert('Error', 'Failed to save plant. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Your Plant</Text>
          <TouchableOpacity 
            onPress={handleSave}
            disabled={isLoading || !nickname.trim()}
          >
            <Text style={[
              styles.saveButton,
              (!nickname.trim() || isLoading) && styles.saveButtonDisabled
            ]}>
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Plant Preview */}
        {(identificationResult || capturedImage) && (
          <View style={styles.previewSection}>
            {capturedImage && (
              <Image source={{ uri: capturedImage }} style={styles.previewImage} />
            )}
            
            {identificationResult && (
              <View style={styles.identificationInfo}>
                <Text style={styles.identifiedName}>
                  ✓ {identificationResult.common_name}
                </Text>
                <Text style={styles.scientificName}>
                  {identificationResult.scientific_name}
                </Text>
                <Text style={styles.confidence}>
                  {identificationResult.confidence}% match
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Customize Your Plant</Text>
          <Text style={styles.sectionTitleAr}>خصص نباتك</Text>

          {/* Plant Nickname */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Plant Nickname</Text>
            <Text style={styles.labelAr}>اسم النبات</Text>
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              placeholder={
                identificationResult 
                  ? `e.g. My ${identificationResult.common_name}`
                  : 'e.g. Living Room Plant'
              }
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          {/* Plant Location */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Plant Location</Text>
            <Text style={styles.labelAr}>موقع النبات</Text>
            <View style={styles.optionsGrid}>
              {PLANT_LOCATIONS.map((location) => (
                <TouchableOpacity
                  key={location.value}
                  style={[
                    styles.optionCard,
                    selectedLocation === location.value && styles.optionCardSelected,
                  ]}
                  onPress={() => setSelectedLocation(location.value)}
                >
                  <Text style={[
                    styles.optionText,
                    selectedLocation === location.value && styles.optionTextSelected,
                  ]}>
                    {location.label}
                  </Text>
                  <Text style={[
                    styles.optionTextAr,
                    selectedLocation === location.value && styles.optionTextArSelected,
                  ]}>
                    {location.labelAr}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Window Direction */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Window Direction</Text>
            <Text style={styles.labelAr}>اتجاه النافذة</Text>
            
            <View style={styles.compassContainer}>
              <View style={styles.compass}>
                {WINDOW_DIRECTIONS.map((direction) => (
                  <TouchableOpacity
                    key={direction.value}
                    style={[
                      styles.compassDirection,
                      styles[`compass${direction.value.charAt(0).toUpperCase() + direction.value.slice(1)}` as keyof typeof styles],
                      selectedDirection === direction.value && styles.compassDirectionSelected,
                    ]}
                    onPress={() => setSelectedDirection(direction.value)}
                  >
                    <Text style={[
                      styles.compassText,
                      selectedDirection === direction.value && styles.compassTextSelected,
                    ]}>
                      {direction.value.charAt(0).toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
                
                <View style={styles.compassCenter}>
                  <Text style={styles.compassCenterIcon}>🧭</Text>
                </View>
              </View>
              
              <Text style={styles.selectedDirection}>
                Selected: {WINDOW_DIRECTIONS.find(d => d.value === selectedDirection)?.label}
              </Text>
              <Text style={styles.selectedDirectionAr}>
                المحدد: {WINDOW_DIRECTIONS.find(d => d.value === selectedDirection)?.labelAr}
              </Text>
            </View>
          </View>

          {/* Care Tips */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Care Tips</Text>
            <Text style={styles.labelAr}>نصائح العناية</Text>
            
            <View style={styles.tipsContainer}>
              <View style={styles.tipCard}>
                <Text style={styles.tipIcon}>💧</Text>
                <Text style={styles.tipText}>
                  Water every 7 days (we'll remind you!)
                </Text>
              </View>
              
              <View style={styles.tipCard}>
                <Text style={styles.tipIcon}>☀️</Text>
                <Text style={styles.tipText}>
                  {selectedDirection === 'north' && 'Perfect for low-light plants'}
                  {selectedDirection === 'east' && 'Great morning light, ideal for most plants'}
                  {selectedDirection === 'south' && 'Brightest spot, good for sun-loving plants'}
                  {selectedDirection === 'west' && 'Afternoon sun, watch for heat stress'}
                </Text>
              </View>
              
              <View style={styles.tipCard}>
                <Text style={styles.tipIcon}>🏛️</Text>
                <Text style={styles.tipText}>
                  Cairo tip: Check soil more often during summer heat
                </Text>
              </View>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButtonLarge,
              (!nickname.trim() || isLoading) && styles.saveButtonLargeDisabled,
            ]}
            onPress={handleSave}
            disabled={isLoading || !nickname.trim()}
          >
            <Ionicons 
              name="checkmark-circle-outline" 
              size={24} 
              color={(!nickname.trim() || isLoading) ? COLORS.textSecondary : COLORS.white} 
            />
            <Text style={[
              styles.saveButtonLargeText,
              (!nickname.trim() || isLoading) && styles.saveButtonLargeTextDisabled,
            ]}>
              {isLoading ? 'Saving to garden...' : 'Save to my garden'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  saveButtonDisabled: {
    color: COLORS.textSecondary,
  },
  previewSection: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  identificationInfo: {
    alignItems: 'center',
  },
  identifiedName: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.success,
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 14,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  confidence: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  form: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  sectionTitleAr: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  labelAr: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  optionCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  optionTextSelected: {
    color: COLORS.white,
  },
  optionTextAr: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  optionTextArSelected: {
    color: COLORS.white,
  },
  compassContainer: {
    alignItems: 'center',
  },
  compass: {
    width: 200,
    height: 200,
    position: 'relative',
    backgroundColor: COLORS.background,
    borderRadius: 100,
    marginBottom: 16,
  },
  compassDirection: {
    position: 'absolute',
    width: 40,
    height: 40,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassDirectionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  compassNorth: {
    top: 0,
    left: '50%',
    marginLeft: -20,
  },
  compassEast: {
    right: 0,
    top: '50%',
    marginTop: -20,
  },
  compassSouth: {
    bottom: 0,
    left: '50%',
    marginLeft: -20,
  },
  compassWest: {
    left: 0,
    top: '50%',
    marginTop: -20,
  },
  compassText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  compassTextSelected: {
    color: COLORS.white,
  },
  compassCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -30,
    marginLeft: -30,
    width: 60,
    height: 60,
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassCenterIcon: {
    fontSize: 24,
  },
  selectedDirection: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  selectedDirectionAr: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tipsContainer: {
    gap: 12,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 12,
    fontFamily: 'Helvetica', // Force system font for emoji rendering
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  saveButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
    marginTop: 16,
  },
  saveButtonLargeDisabled: {
    backgroundColor: COLORS.border,
  },
  saveButtonLargeText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonLargeTextDisabled: {
    color: COLORS.textSecondary,
  },
  bottomPadding: {
    height: 20,
  },
});