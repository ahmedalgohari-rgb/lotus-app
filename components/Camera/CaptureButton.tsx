/**
 * Camera Capture Button Component
 * Smart capture button with plant detection logic
 */
import React from 'react';
import { TouchableOpacity, View, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Layout } from '@/constants';
import Text from '@/components/Text';

interface CaptureButtonProps {
  plantDetected: boolean;
  isProcessing: boolean;
  remainingScans: number;
  onCapture: () => void;
}

export default function CaptureButton({
  plantDetected,
  isProcessing,
  remainingScans,
  onCapture,
}: CaptureButtonProps) {
  const isDisabled = !plantDetected || isProcessing || remainingScans <= 0;

  return (
    <View style={styles.captureContainer}>
      {/* Scan Counter */}
      {remainingScans > 0 && (
        <View style={styles.scanCounter}>
          <Text style={styles.scanCountText}>
            {remainingScans} scans remaining
          </Text>
        </View>
      )}
      
      {/* Main Capture Button */}
      <TouchableOpacity
        style={[
          styles.captureButton,
          {
            backgroundColor: isDisabled ? Colors.disabled : Colors.lotusGreen,
            borderColor: isDisabled ? Colors.disabled : '#FFFFFF',
          },
        ]}
        onPress={onCapture}
        disabled={isDisabled}
        accessibilityLabel={isProcessing ? 'Processing image' : 'Capture plant photo'}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
      >
        {isProcessing ? (
          <ActivityIndicator size="large" color="#FFFFFF" />
        ) : (
          <MaterialIcons 
            name="center-focus-strong" 
            size={40} 
            color="#FFFFFF" 
          />
        )}
      </TouchableOpacity>
      
      {/* Status Message */}
      <View style={styles.statusMessage}>
        {remainingScans <= 0 ? (
          <Text style={styles.limitMessage}>
            Daily scan limit reached
          </Text>
        ) : !plantDetected ? (
          <Text style={styles.waitMessage}>
            Point camera at a plant
          </Text>
        ) : isProcessing ? (
          <Text style={styles.processingMessage}>
            Identifying plant...
          </Text>
        ) : (
          <Text style={styles.readyMessage}>
            Tap to scan plant
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  captureContainer: {
    position: 'absolute',
    bottom: Layout.spacing.safeAreaBottom + Layout.spacing.lg,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  scanCounter: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    borderRadius: 20,
    marginBottom: Layout.spacing.md,
    backdropFilter: 'blur(10px)',
  },
  scanCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  statusMessage: {
    marginTop: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
  },
  limitMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    borderRadius: 16,
    overflow: 'hidden',
    backdropFilter: 'blur(10px)',
  },
  waitMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.8,
  },
  processingMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    borderRadius: 16,
    overflow: 'hidden',
    backdropFilter: 'blur(10px)',
  },
  readyMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    borderRadius: 16,
    overflow: 'hidden',
    backdropFilter: 'blur(10px)',
  },
});