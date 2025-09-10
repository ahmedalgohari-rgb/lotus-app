import React, { FC } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Layout } from '@/constants';

interface HomeScreenProps {}

export const HomeScreen: FC<HomeScreenProps> = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  text: {
    ...Typography.screenTitle,
    color: Colors.lotusGreen,
  },
});

export default HomeScreen;
