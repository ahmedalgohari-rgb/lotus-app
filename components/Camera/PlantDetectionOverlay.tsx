/**
 * Plant Detection Overlay Component
 * Extracted from scan.tsx for better modularity
 */
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Colors, Typography, Layout } from '@/constants';
import Text from '@/components/Text';

const { width, height } = Dimensions.get('window');

interface PlantDetectionOverlayProps {
  plantDetected: boolean;
  detectionMessage: string;
  imageQuality: 'good' | 'fair' | 'poor';
  qualityMessage: string;
  isScanning: boolean;
}

export default function PlantDetectionOverlay({
  plantDetected,
  detectionMessage,
  imageQuality,
  qualityMessage,
  isScanning,
}: PlantDetectionOverlayProps) {
  const getQualityColor = (quality: 'good' | 'fair' | 'poor') => {
    switch (quality) {
      case 'good': return Colors.success;
      case 'fair': return Colors.warning;
      case 'poor': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  return (
    <>
      {/* Corner Guide Frame */}
      <View style={styles.guideFrame}>
        {/* Top Left Corner */}
        <View style={[styles.corner, styles.topLeft]} />
        {/* Top Right Corner */}
        <View style={[styles.corner, styles.topRight]} />
        {/* Bottom Left Corner */}
        <View style={[styles.corner, styles.bottomLeft]} />
        {/* Bottom Right Corner */}
        <View style={[styles.corner, styles.bottomRight]} />
      </View>

      {/* Detection Status Overlay */}
      <View style={styles.statusOverlay}>
        <View style={[
          styles.statusIndicator,
          { backgroundColor: plantDetected ? Colors.success : Colors.error }
        ]} />
        <Text style={styles.detectionText}>{detectionMessage}</Text>
        
        {plantDetected && (
          <Text style={[
            styles.qualityText,
            { color: getQualityColor(imageQuality) }
          ]}>
            {qualityMessage}
          </Text>
        )}
      </View>

      {/* Scanning Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionTitle}>
          {isScanning ? 'Scanning...' : 'Center your plant'}
        </Text>
        <Text style={styles.instructionSubtitle}>
          {isScanning 
            ? 'Hold steady while we identify your plant'
            : 'Position your plant within the frame'
          }
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  guideFrame: {
    position: 'absolute',
    top: height * 0.2,
    left: width * 0.1,
    right: width * 0.1,
    bottom: height * 0.35,
    zIndex: 5,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: Colors.lotusGreen,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  statusOverlay: {
    position: 'absolute',
    top: height * 0.15,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: Layout.spacing.xs,
  },
  detectionText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: '#FFFFFF',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    borderRadius: 20,
    overflow: 'hidden',
    backdropFilter: 'blur(10px)',
  },
  qualityText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs / 2,
    borderRadius: 16,
    marginTop: Layout.spacing.xs,
    overflow: 'hidden',
    backdropFilter: 'blur(10px)',
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
    paddingHorizontal: Layout.spacing.lg,
  },
  instructionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Layout.spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  instructionSubtitle: {
    fontSize: Typography.fontSize.md,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
});