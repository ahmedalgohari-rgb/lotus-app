/**
 * Optimized Lotus Camera Scan Screen
 * Refactored from 959 lines to ~200 lines using extracted components
 */
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

// Platform-specific camera import
let CameraView: any = null;
let useCameraPermissions: any = null;

if (Platform.OS !== 'web') {
  const cameraModule = require('expo-camera');
  CameraView = cameraModule.CameraView;
  useCameraPermissions = cameraModule.useCameraPermissions;
} else {
  CameraView = ({ children, ...props }: any) => <View {...props}>{children}</View>;
  useCameraPermissions = () => [{ granted: false }, () => {}];
}

// Services
import { plantIdentificationService } from '@/services/plantIdentification';
import { aiPlantIdentificationService } from '@/services/aiPlantIdentification';
import { useUser, useIsAuthenticated } from '@/store/authStore';

// Extracted Components
import CameraPermissions from '@/components/Camera/CameraPermissions';
import CameraControls from '@/components/Camera/CameraControls';
import PlantDetectionOverlay from '@/components/Camera/PlantDetectionOverlay';
import CaptureButton from '@/components/Camera/CaptureButton';
import { Colors } from '@/constants';

const { width, height } = Dimensions.get('window');

export default function ScanScreen() {
  const router = useRouter();
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const cameraRef = useRef<any>(null);
  
  // Permission state
  const [permission, requestPermission] = useCameraPermissions();
  
  // Camera state
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'on' | 'off'>('off');
  
  // Detection state
  const [plantDetected, setPlantDetected] = useState(false);
  const [detectionMessage, setDetectionMessage] = useState('Point camera at a plant');
  const [imageQuality, setImageQuality] = useState<'good' | 'fair' | 'poor'>('poor');
  const [qualityMessage, setQualityMessage] = useState('');
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [remainingScans, setRemainingScans] = useState(2);

  // Simulate plant detection (real implementation would use computer vision)
  const analyzeImageFeed = useCallback(() => {
    try {
      const detected = Math.random() > 0.4; // 60% chance of detection
      setPlantDetected(detected);
      
      if (detected) {
        setDetectionMessage('Plant detected - ready to scan');
        const qualities = [
          { quality: 'good' as const, message: 'Perfect lighting and focus' },
          { quality: 'fair' as const, message: 'Good - try to get closer' },
          { quality: 'poor' as const, message: 'Plant detected - improve lighting' },
        ];
        
        const randomQuality = qualities[Math.floor(Math.random() * qualities.length)];
        setImageQuality(randomQuality.quality);
        setQualityMessage(randomQuality.message);
      } else {
        setDetectionMessage('No plant detected - point camera at a plant');
        setImageQuality('poor');
        setQualityMessage('Point camera at a plant to continue');
      }
    } catch (error) {
      console.error('Plant detection failed:', error);
      setPlantDetected(false);
      setDetectionMessage('Detection unavailable');
    }
  }, []);

  // Check scan limits
  const checkScanLimits = useCallback(async () => {
    try {
      const scanStatus = await aiPlantIdentificationService.checkScanLimit();
      setRemainingScans(scanStatus.remainingScans);
    } catch (error) {
      console.error('Error checking scan limits:', error);
    }
  }, []);

  // Handle camera capture
  const handleCapture = useCallback(async () => {
    if (!plantDetected || isProcessing || remainingScans <= 0) {
      return;
    }

    try {
      setIsProcessing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          skipProcessing: false,
        });

        // Process plant identification
        const identificationResult = await plantIdentificationService.identifyPlant(photo.uri);
        
        // Navigate to results
        router.push({
          pathname: '/plants/result',
          params: {
            imageUri: photo.uri,
            ...identificationResult,
          },
        });
      }
    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert('Error', 'Failed to capture or identify plant. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [plantDetected, isProcessing, remainingScans, router]);

  // Camera control handlers
  const handleFlashToggle = useCallback(() => {
    setFlash(current => current === 'off' ? 'on' : 'off');
    Haptics.selectionAsync();
  }, []);

  const handleGalleryPress = useCallback(() => {
    // Implementation for gallery selection
    Alert.alert('Gallery', 'Gallery selection coming soon!');
  }, []);

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  const handleTipsPress = useCallback(() => {
    Alert.alert('Scanning Tips', 'For best results:\n\n• Ensure good lighting\n• Hold camera steady\n• Center the plant in frame\n• Avoid shadows on the plant');
  }, []);

  // Effects
  React.useEffect(() => {
    checkScanLimits();
  }, [checkScanLimits]);

  React.useEffect(() => {
    const interval = setInterval(analyzeImageFeed, 2000);
    return () => clearInterval(interval);
  }, [analyzeImageFeed]);

  // Permission check
  if (!permission) {
    return <View style={styles.loadingContainer} />;
  }

  if (!permission.granted) {
    return <CameraPermissions onRequestPermission={requestPermission} />;
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash}
        mirror={false}
      >
        {/* Camera Controls */}
        <CameraControls
          flash={flash}
          onFlashToggle={handleFlashToggle}
          onGalleryPress={handleGalleryPress}
          onBackPress={handleBackPress}
          onTipsPress={handleTipsPress}
        />

        {/* Plant Detection Overlay */}
        <PlantDetectionOverlay
          plantDetected={plantDetected}
          detectionMessage={detectionMessage}
          imageQuality={imageQuality}
          qualityMessage={qualityMessage}
          isScanning={isProcessing}
        />

        {/* Capture Button */}
        <CaptureButton
          plantDetected={plantDetected}
          isProcessing={isProcessing}
          remainingScans={remainingScans}
          onCapture={handleCapture}
        />
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  camera: {
    flex: 1,
    width: width,
    height: height,
  },
});