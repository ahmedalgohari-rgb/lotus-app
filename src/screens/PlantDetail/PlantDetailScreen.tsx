import React, { FC } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { Colors, Layout, Typography } from '@/constants';
import { Card, ScreenTitle, BodyText, SectionHeader, Button } from '@/components';
import { getPlantSpeciesById } from '@/utils/plantData';

type PlantDetailScreenRouteProp = RouteProp<RootStackParamList, 'PlantDetail'>;

interface PlantDetailScreenProps {}

export const PlantDetailScreen: FC<PlantDetailScreenProps> = () => {
  const route = useRoute<PlantDetailScreenRouteProp>();
  const navigation = useNavigation();
  const { plantId } = route.params;

  // Fetch plant data (using placeholder for now)
  const plant = getPlantSpeciesById(plantId) || {
    id: plantId,
    commonName: 'Unknown Plant',
    arabicName: 'نبتة غير معروفة',
    scientificName: 'N/A',
    description: 'No description available.',
    careInstructions: {
      watering: 'N/A',
      light: 'N/A',
      humidity: 'N/A',
      temperature: 'N/A',
      soil: 'N/A',
      fertilization: 'N/A',
      pruning: 'N/A',
    },
    windowPositionRatings: {
      North: 0,
      East: 0,
      South: 0,
      West: 0,
    },
    cairoTips: {
      en: 'N/A',
      ar: 'N/A',
    },
    imageUrl: 'https://via.placeholder.com/300',
  };

  // Placeholder for care history
  const careHistory = [
    { id: '1', type: 'Watered', date: '2024-07-28' },
    { id: '2', type: 'Pruned', date: '2024-07-20' },
    { id: '3', type: 'Fed', date: '2024-07-15' },
  ];

  const handleCareAction = (action: string) => {
    Alert.alert('Care Action', `You ${action} your ${plant.commonName}!`);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Hero Image */}
      <View style={styles.heroContainer}>
        <Image source={{ uri: plant.imageUrl }} style={styles.heroImage} />
        <View style={styles.healthStatusPill}>
          <BodyText style={styles.healthStatusText}>Healthy</BodyText>
        </View>
      </View>

      <View style={styles.contentContainer}>
        {/* Plant Name */}
        <ScreenTitle style={styles.commonName}>{plant.commonName}</ScreenTitle>
        <BodyText style={styles.scientificName}>{plant.scientificName}</BodyText>

        {/* Quick Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <Button title="Water" onPress={() => handleCareAction('watered')} style={styles.actionButton} />
          <Button title="Prune" onPress={() => handleCareAction('pruned')} style={styles.actionButton} variant="secondary" />
          <Button title="Feed" onPress={() => handleCareAction('fed')} style={styles.actionButton} variant="secondary" />
        </View>

        {/* Plant Info Cards */}
        <Card style={styles.infoCard}>
          <SectionHeader style={styles.sectionHeader}>Care Instructions</SectionHeader>
          <BodyText>Watering: {plant.careInstructions.watering}</BodyText>
          <BodyText>Light: {plant.careInstructions.light}</BodyText>
          <BodyText>Humidity: {plant.careInstructions.humidity}</BodyText>
        </Card>

        <Card style={styles.infoCard}>
          <SectionHeader style={styles.sectionHeader}>Window Position Ratings</SectionHeader>
          {Object.entries(plant.windowPositionRatings).map(([direction, rating]) => (
            <View key={direction} style={styles.ratingItem}>
              <BodyText style={styles.ratingDirection}>{direction}:</BodyText>
              <Text>{'⭐'.repeat(rating as number)}</Text>
            </View>
          ))}
        </Card>

        {/* Care History */}
        <Card style={styles.infoCard}>
          <SectionHeader style={styles.sectionHeader}>Care History</SectionHeader>
          {careHistory.map((event) => (
            <View key={event.id} style={styles.historyItem}>
              <BodyText style={styles.historyItemText}>{event.type} on {event.date}</BodyText>
            </View>
          ))}
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  heroContainer: {
    width: '100%',
    height: 250,
    backgroundColor: Colors.gray,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute',
  },
  healthStatusPill: {
    backgroundColor: Colors.healthy,
    paddingHorizontal: Layout.sm,
    paddingVertical: Layout.xs,
    borderRadius: Layout.borderRadius.medium,
    margin: Layout.sm,
  },
  healthStatusText: {
    color: Colors.pureWhite,
    fontWeight: 'bold',
  },
  contentContainer: {
    padding: Layout.screenPadding,
  },
  commonName: {
    color: Colors.lotusGreen,
    marginBottom: Layout.xs,
  },
  scientificName: {
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: Layout.sectionSpacing,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Layout.sectionSpacing,
  },
  actionButton: {
    width: '30%',
  },
  infoCard: {
    marginBottom: Layout.sectionSpacing,
  },
  sectionHeader: {
    marginBottom: Layout.sm,
    color: Colors.textPrimary,
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
  historyItem: {
    paddingVertical: Layout.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  historyItemText: {
    color: Colors.textPrimary,
  },
});

export default PlantDetailScreen;