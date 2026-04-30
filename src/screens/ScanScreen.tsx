import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { COLORS, FIBONACCI, TYPOGRAPHY } from '../constants';
import { createPlantIdService } from '../services/plant-identification';
import { getCurrentLanguage } from '../i18n';
import { logger, timer } from '../utils/logger';
import { trackPlantScanned } from '../services/analytics';

// Camera constants (never change during component lifecycle)
const CAMERA_ZOOM = 0;
const CAMERA_FACING: CameraType = 'back';

export default function ScanScreen({ route }: any) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(false);
  const [flashlightEnabled, setFlashlightEnabled] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const navigation = useNavigation();

  // Auto-request camera permission on mount (triggers native iOS prompt)
  useEffect(() => {
    if (permission && !permission.granted && !permission.canAskAgain) {
      // Permission was denied permanently - do nothing, show settings screen
      return;
    }

    if (permission && !permission.granted) {
      // Trigger native iOS permission prompt
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Handle navigation parameters when returning from auth
  useEffect(() => {
    if (route?.params?.showResult && route?.params?.identificationResult) {
      // Navigate to PlantResultScreen instead of showing modal
      navigation.navigate('PlantResult', {
        identificationResult: route.params.identificationResult,
        capturedImage: route.params.capturedImage,
      });

      // Clear the parameters to prevent re-triggering
      navigation.setParams({
        showResult: undefined,
        identificationResult: undefined,
        capturedImage: undefined,
      });
    }
  }, [route?.params, navigation]);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        setIsLoading(true);
        timer.start('camera-capture');
        logger.debug('Camera capture initiated', { zoom: CAMERA_ZOOM });

        const photo = await cameraRef.current.takePictureAsync({
          quality: 1.0,  // Maximum quality for better plant identification
          base64: false,
        });

        if (photo) {
          logger.debug('Photo captured', { uri: photo.uri, width: photo.width, height: photo.height });

          // Auto-close flashlight after photo capture (matches iOS Camera app UX)
          if (flashlightEnabled) {
            setFlashlightEnabled(false);
            logger.debug('Auto-disabled flashlight after capture');
          }

          // Send directly to PlantNet API for real AI analysis
          logger.info('📸 Sending image directly to PlantNet AI');

          await identifyPlant(photo.uri);
          timer.end('camera-capture');
        }
      } catch (error) {
        logger.error('Error in capture:', error);
        Alert.alert('Camera Error', 'Failed to take picture. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const pickImage = async () => {
    try {
      // Request permission (triggers native iOS prompt if not already granted)
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.status !== 'granted') {
        // User denied permission - show alert with option to go to settings
        Alert.alert(
          t('scan.permissions.noPhotoAccess'),
          t('scan.permissions.photoSettingsPrompt'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('scan.permissions.openSettings'), onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsLoading(true);
        const imageUri = result.assets[0].uri;

        // Send gallery image directly to PlantNet API
        logger.info('📸 Sending gallery image directly to PlantNet AI');

        // Don't set capturedImage - keep camera view visible during identification
        await identifyPlant(imageUri);
      }
    } catch (error) {
      logger.error('Error picking image:', error);
      Alert.alert('Gallery Error', 'Failed to pick image. Please try again.');
    } finally{
      setIsLoading(false);
    }
  };

  const identifyPlant = async (imageUri: string) => {
    try {
      setIsLoading(true);
      logger.group('🌿 Plant Identification Flow');
      timer.start('plant-identification');

      // Use plant identification service
      const currentLang = getCurrentLanguage() as 'en' | 'ar';
      logger.debug('Starting plant identification', {
        language: currentLang,
        organ: 'leaf',
        imageUri: imageUri.substring(0, 50) + '...'
      });

      // Use modular plant identification service (provider-agnostic)
      const plantIdService = createPlantIdService();
      const result = await plantIdService.identifyPlant(imageUri, currentLang);
      timer.end('plant-identification');

      if (result) {
        logger.success('Plant identified successfully!', {
          name: result.common_name,
          scientificName: result.scientific_name,
          confidence: `${result.confidence}%`
        });

        trackPlantScanned({
          result: 'identified',
          confidence: result.confidence,
          scientificName: result.scientific_name,
          commonName: result.common_name,
        });

        logger.groupEnd();

        // Navigate to PlantResultScreen instead of showing modal
        navigation.navigate('PlantResult', {
          identificationResult: result,
          capturedImage: imageUri,
        });
      } else {
        logger.warn('No identification results returned');
        trackPlantScanned({ result: 'not_found' });
        logger.groupEnd();

        // Phase 1: Simple Alert with fixed navigation
        Alert.alert(
          'No Results',
          'Could not identify this plant. Please try a clearer photo of the leaves with good lighting.',
          [
            { text: 'Try Again', style: 'default' },
            { text: 'Manual Add', onPress: () => navigation.navigate('AddScan') },
            { text: 'OK', style: 'cancel' },
          ]
        );
      }
    } catch (error) {
      logger.error('Error identifying plant:', error);
      logger.groupEnd();

      Alert.alert(
        'Identification Error',
        'Failed to identify plant. Please check your connection and try again.',
        [
          { text: 'Try Again', style: 'default' },
          { text: 'OK', style: 'cancel' },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while checking permissions
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Permission denied - native iOS prompt already handled this
  // Just show loading screen, the useEffect will trigger the native prompt
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View - Always Visible */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={CAMERA_FACING}
        zoom={CAMERA_ZOOM}
        enableTorch={flashlightEnabled}
      />

      {/* Camera Guide Frame */}
      {!isLoading && (
        <View style={styles.cameraGuide}>
          <View style={styles.guideFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>
      )}

      {/* Instructions */}
      {!isLoading && (
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionPill}>
            <Text style={styles.instructionText} numberOfLines={1}>
              {t('scan.instructions.centerPlant')}
            </Text>
          </View>
        </View>
      )}

      {/* Capture Button */}
      {!isLoading && (
        <View style={styles.captureContainer}>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={takePicture}
            activeOpacity={0.8}
          >
            <View style={styles.captureInner}>
              <Ionicons name="camera" size={36} color={COLORS.white} />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Header Controls - Hidden during loading */}
      {!isLoading && (
        <View style={styles.headerOverlay}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('scan.title')}</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setFlashlightEnabled(!flashlightEnabled)}
          >
            <Ionicons
              name={flashlightEnabled ? "flash" : "flash-outline"}
              size={24}
              color={COLORS.white}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Gallery Control - Hidden during loading */}
      {!isLoading && (
        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
            <Ionicons name="images-outline" size={24} color={COLORS.white} />
            <Text style={styles.controlText}>{t('scan.instructions.gallery')}</Text>
          </TouchableOpacity>

          {/* Spacer to keep gallery button on left */}
          <View style={{ flex: 1 }} />
        </View>
      )}

      {/* Loading Overlay - Shows on Camera During Identification */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>{t('scan.analyzing')}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: FIBONACCI.LG,
    zIndex: 20,
  },
  bottomControls: {
    position: 'absolute',
    bottom: FIBONACCI.XXL,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: FIBONACCI.LG,
    zIndex: 20,
  },
  headerButton: {
    width: FIBONACCI.XL,
    height: FIBONACCI.XL,
    borderRadius: FIBONACCI.LG,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.LG,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
  },
  cameraGuide: {
    position: 'absolute',
    top: '20%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  guideFrame: {
    width: 260,
    height: 260,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderColor: COLORS.primary,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  instructionsContainer: {
    position: 'absolute',
    top: '62%',
    left: FIBONACCI.MD,
    right: FIBONACCI.MD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionPill: {
    backgroundColor: 'rgba(70,70,70,0.9)',
    paddingVertical: FIBONACCI.MD,
    paddingHorizontal: FIBONACCI.LG,
    borderRadius: 50,
    maxWidth: '95%',
  },
  instructionText: {
    fontSize: TYPOGRAPHY.SM,
    fontWeight: '400',
    color: COLORS.white,
    textAlign: 'center',
  },
  captureContainer: {
    position: 'absolute',
    top: '80%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  galleryButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: FIBONACCI.MD,
    paddingVertical: FIBONACCI.SM,
    borderRadius: FIBONACCI.LG,
  },
  controlText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.XS,
    marginTop: FIBONACCI.XXS,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  captureButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: COLORS.white,
  },
  captureInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    padding: FIBONACCI.XL,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 250,
    maxWidth: 300,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
    width: '100%',
    flexWrap: 'wrap',
  },
});