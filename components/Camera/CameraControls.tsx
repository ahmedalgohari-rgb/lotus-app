/**
 * Camera Controls Component
 * Extracted camera control buttons and functionality
 */
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Layout } from '@/constants';

interface CameraControlsProps {
  flash: 'on' | 'off';
  onFlashToggle: () => void;
  onGalleryPress: () => void;
  onBackPress: () => void;
  onTipsPress: () => void;
}

export default function CameraControls({
  flash,
  onFlashToggle,
  onGalleryPress,
  onBackPress,
  onTipsPress,
}: CameraControlsProps) {
  return (
    <>
      {/* Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={onBackPress}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={onFlashToggle}
          accessibilityLabel={flash === 'on' ? 'Turn flash off' : 'Turn flash on'}
          accessibilityRole="button"
        >
          <Ionicons 
            name={flash === 'on' ? 'flash' : 'flash-off'} 
            size={24} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
      </View>

      {/* Side Controls */}
      <View style={styles.sideControls}>
        <TouchableOpacity 
          style={styles.sideButton} 
          onPress={onGalleryPress}
          accessibilityLabel="Open gallery"
          accessibilityRole="button"
        >
          <Ionicons name="images" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.sideButton} 
          onPress={onTipsPress}
          accessibilityLabel="View scanning tips"
          accessibilityRole="button"
        >
          <Ionicons name="help-circle" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  topControls: {
    position: 'absolute',
    top: Layout.spacing.safeAreaTop + Layout.spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    zIndex: 10,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  sideControls: {
    position: 'absolute',
    right: Layout.spacing.lg,
    top: '50%',
    transform: [{ translateY: -60 }],
    alignItems: 'center',
    zIndex: 10,
  },
  sideButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
    backdropFilter: 'blur(10px)',
  },
});