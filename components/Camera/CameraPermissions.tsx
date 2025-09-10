/**
 * Camera Permissions Component
 * Extracted from scan.tsx for better modularity
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Layout } from '@/constants';
import Text from '@/components/Text';
import Button from '@/components/Button';

interface CameraPermissionsProps {
  onRequestPermission: () => void;
}

export default function CameraPermissions({ onRequestPermission }: CameraPermissionsProps) {
  return (
    <View style={styles.permissionContainer}>
      <View style={styles.permissionContent}>
        <MaterialIcons name="center-focus-strong" size={64} color={Colors.lotusGreen} />
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionMessage}>
          We need camera access to identify your plants and add them to your collection
        </Text>
        <Button
          variant="primary"
          title="Enable Camera"
          onPress={onRequestPermission}
          style={styles.permissionButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.xl,
  },
  permissionContent: {
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
  },
  permissionTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.xl,
    lineHeight: 24,
  },
  permissionButton: {
    minWidth: 200,
  },
});