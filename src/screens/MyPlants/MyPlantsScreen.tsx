import React, { FC } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Layout, Typography } from '@/constants';
import { Card, ScreenTitle, BodyText } from '@/components';

interface MyPlantsScreenProps {}

// Placeholder data for plants
const plants = [
  { id: '1', nickname: 'My Lovely Ficus', location: 'Living Room', lastWatered: '2d', nextWatering: '5d', sunExposure: 'E' },
  { id: '2', nickname: 'Green Buddy', location: 'Bedroom', lastWatered: '1d', nextWatering: '3d', sunExposure: 'N' },
  { id: '3', nickname: 'Office Palm', location: 'Office', lastWatered: '3d', nextWatering: '7d', sunExposure: 'S' },
  { id: '4', nickname: 'Kitchen Herb', location: 'Kitchen', lastWatered: 'today', nextWatering: '2d', sunExposure: 'W' },
];

const PlantCard: FC<{ plant: typeof plants[0]; onPress: () => void }> = ({ plant, onPress }) => (
  <TouchableOpacity style={styles.plantCardWrapper} onPress={onPress}>
    <Card style={styles.plantCard}>
      <Text style={styles.plantNickname}>{plant.nickname}</Text>
      <BodyText style={styles.plantLocation}>{plant.location}</BodyText>
      <View style={styles.careStatusContainer}>
        <BodyText style={styles.careStatus}>💧 {plant.lastWatered}</BodyText>
        <BodyText style={styles.careStatus}>☀️ {plant.sunExposure}</BodyText>
      </View>
    </Card>
  </TouchableOpacity>
);

export const MyPlantsScreen: FC<MyPlantsScreenProps> = () => {
  const navigation = useNavigation();

  const renderItem = ({ item }: { item: typeof plants[0] }) => (
    <PlantCard plant={item} onPress={() => navigation.navigate('PlantDetail' as never, { plantId: item.id })} />
  );

  return (
    <View style={styles.container}>
      <ScreenTitle style={styles.title}>My Plants</ScreenTitle>
      <BodyText style={styles.subtitle}>Your green companions</BodyText>

      <FlatList
        data={plants}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.plantGrid}
        ListFooterComponent={() => (
          <TouchableOpacity style={styles.addPlantCardWrapper} onPress={() => navigation.navigate('AddPlant' as never)}>
            <Card style={styles.addPlantCard}>
              <Text style={styles.addPlantText}>+</Text>
              <BodyText>Add New Plant</BodyText>
            </Card>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Layout.screenPadding,
  },
  title: {
    color: Colors.lotusGreen,
    marginBottom: Layout.xs,
  },
  subtitle: {
    color: Colors.textSecondary,
    marginBottom: Layout.sectionSpacing,
  },
  plantGrid: {
    justifyContent: 'space-between',
  },
  plantCardWrapper: {
    flex: 1,
    margin: Layout.xs,
  },
  plantCard: {
    height: 180,
    justifyContent: 'space-between',
  },
  plantNickname: {
    ...Typography.sectionHeader,
    color: Colors.textPrimary,
  },
  plantLocation: {
    color: Colors.textSecondary,
  },
  careStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Layout.sm,
  },
  careStatus: {
    color: Colors.lotusGreen,
    fontWeight: 'bold',
  },
  addPlantCardWrapper: {
    flex: 1,
    margin: Layout.xs,
  },
  addPlantCard: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: Colors.surfaceVariant,
  },
  addPlantText: {
    fontSize: 48,
    color: Colors.textSecondary,
  },
});

export default MyPlantsScreen;
