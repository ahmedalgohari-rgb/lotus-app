import React, { FC, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import { Colors, Layout, Typography } from '@/constants';
import { Button, Input, ScreenTitle, SectionHeader, Card } from '@/components';
import { RootStackParamList } from '@/navigation/types';

type AddPlantScreenRouteProp = RouteProp<RootStackParamList, 'AddPlant'>;

interface AddPlantScreenProps {}

export const AddPlantScreen: FC<AddPlantScreenProps> = () => {
  const navigation = useNavigation();
  const route = useRoute<AddPlantScreenRouteProp>();
  const { identificationData } = route.params || {};

  const [nickname, setNickname] = useState('');
  const [location, setLocation] = useState('');
  const [windowDirection, setWindowDirection] = useState('');

  const handleSavePlant = () => {
    if (!nickname || !location || !windowDirection) {
      Alert.alert('Missing Information', 'Please fill in all fields.');
      return;
    }

    // Here you would typically save the plant data to a database
    // For now, we'll just show an alert
    Alert.alert(
      'Plant Saved!',
      `Nickname: ${nickname}\nLocation: ${location}\nWindow Direction: ${windowDirection}\nIdentification Data: ${JSON.stringify(identificationData)}`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <ScreenTitle style={styles.title}>Add New Plant</ScreenTitle>
      <BodyText style={styles.subtitle}>Tell us about your new green friend!</BodyText>

      <Card style={styles.formCard}>
        <SectionHeader style={styles.sectionHeader}>Plant Details</SectionHeader>
        <Input
          label="Nickname"
          placeholder="e.g., My Lovely Ficus"
          value={nickname}
          onChangeText={setNickname}
          style={styles.input}
        />

        <Input
          label="Location"
          placeholder="e.g., Living Room, Bedroom"
          value={location}
          onChangeText={setLocation}
          style={styles.input}
        />

        <Input
          label="Window Direction"
          placeholder="e.g., North, East, South, West"
          value={windowDirection}
          onChangeText={setWindowDirection}
          style={styles.input}
        />

        <Button title="Save Plant" onPress={handleSavePlant} style={styles.saveButton} />
      </Card>
    </ScrollView>
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
  formCard: {
    padding: Layout.screenPadding,
  },
  sectionHeader: {
    marginBottom: Layout.sm,
    color: Colors.textPrimary,
  },
  input: {
    marginBottom: Layout.sm,
  },
  saveButton: {
    marginTop: Layout.m,
  },
});

export default AddPlantScreen;
