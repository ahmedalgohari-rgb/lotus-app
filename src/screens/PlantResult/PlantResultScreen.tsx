import React, { FC } from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { Colors, Layout, Typography } from '@/constants';
import { Button, Card, ScreenTitle, BodyText, SectionHeader } from '@/components';

type PlantResultScreenRouteProp = RouteProp<RootStackParamList, 'PlantResult'>;

interface PlantResultScreenProps {}

export const PlantResultScreen: FC<PlantResultScreenProps> = () => {
  const route = useRoute<PlantResultScreenRouteProp>();
  const navigation = useNavigation();
  const { imageUri, identificationData } = route.params;

  // Mock data for now, replace with actual identificationData parsing
  const commonName = identificationData?.common_name || 'Unknown Plant';
  const scientificName = identificationData?.scientific_name || 'N/A';
  const confidence = identificationData?.confidence || 0.85; // Example confidence
  const careRequirements = identificationData?.care_requirements || [
    { type: 'Watering', details: 'Water every 7-10 days' },
    { type: 'Light', details: 'Bright indirect light' },
    { type: 'Humidity', details: 'Moderate to high' },
  ];
  const windowDirectionRating = identificationData?.window_direction_rating || {
    North: 4,
    East: 3,
    South: 2,
    West: 5,
  }; // Example ratings

  const handleAddPlant = () => {
    // Navigate to Add Plant screen, passing identification data
    navigation.navigate('AddPlant' as never, { identificationData });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.plantImage} />
        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceText}>{(confidence * 100).toFixed(0)}% Match</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <Card style={styles.infoCard}>
          <ScreenTitle style={styles.commonName}>{commonName}</ScreenTitle>
          <BodyText style={styles.scientificName}>{scientificName}</BodyText>
        </Card>

        <Card style={styles.infoCard}>
          <SectionHeader style={styles.sectionHeader}>Care Requirements</SectionHeader>
          {careRequirements.map((item, index) => (
            <View key={index} style={styles.careItem}>
              <BodyText style={styles.careItemType}>{item.type}:</BodyText>
              <BodyText>{item.details}</BodyText>
            </View>
          ))}
        </Card>

        <Card style={styles.infoCard}>
          <SectionHeader style={styles.sectionHeader}>Window Direction Rating</SectionHeader>
          {Object.entries(windowDirectionRating).map(([direction, rating]) => (
            <View key={direction} style={styles.ratingItem}>
              <BodyText style={styles.ratingDirection}>{direction}:</BodyText>
              <Text>{'⭐'.repeat(rating as number)}</Text>
            </View>
          ))}
        </Card>

        <Button title="Add to My Plants" onPress={handleAddPlant} style={styles.addButton} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: Colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plantImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  confidenceBadge: {
    position: 'absolute',
    bottom: Layout.sm,
    right: Layout.sm,
    backgroundColor: Colors.lotusGreen,
    paddingHorizontal: Layout.sm,
    paddingVertical: Layout.xs,
    borderRadius: Layout.borderRadius.medium,
  },
  confidenceText: {
    color: Colors.pureWhite,
    fontSize: Typography.caption.fontSize,
    fontWeight: 'bold',
  },
  contentContainer: {
    padding: Layout.screenPadding,
  },
  infoCard: {
    marginBottom: Layout.sectionSpacing,
  },
  commonName: {
    color: Colors.lotusGreen,
    marginBottom: Layout.xs,
  },
  scientificName: {
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: Layout.sm,
  },
  sectionHeader: {
    marginBottom: Layout.sm,
    color: Colors.textPrimary,
  },
  careItem: {
    flexDirection: 'row',
    marginBottom: Layout.xs,
  },
  careItemType: {
    fontWeight: 'bold',
    marginRight: Layout.xs,
  },
  ratingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.xs,
  },
  ratingDirection: {
    fontWeight: 'bold',
    marginRight: Layout.xs,
  },
  addButton: {
    marginTop: Layout.sectionSpacing,
  },
});

export default PlantResultScreen;
