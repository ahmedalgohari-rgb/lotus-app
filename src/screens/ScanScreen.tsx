import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  ScrollView,
  Linking,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { COLORS, FIBONACCI, TYPOGRAPHY, ELEMENT_SIZES, GOLDEN_RECTANGLES } from '../constants';
import { createPlantIdService, type IdentificationResult } from '../services/plant-identification';
import { getCurrentLanguage } from '../i18n';
import { useStore } from '../store';
import { logger, timer } from '../utils/logger';
import { useRTL } from '../utils/rtl';

export default function ScanScreen({ route }: any) {
  const { t } = useTranslation();
  const isRTL = useRTL();
  const { user, isAuthenticated } = useStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [identificationResult, setIdentificationResult] = useState<IdentificationResult | null>(null);

  // Main camera default (device-dependent)
  // Let the device use its default main camera without preset zoom
  const [zoom, setZoom] = useState(0);

  // Flashlight toggle state
  const [flashlightEnabled, setFlashlightEnabled] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const navigation = useNavigation();

  // Handle navigation parameters when returning from auth
  useEffect(() => {
    if (route?.params?.showResult && route?.params?.identificationResult) {
      // Don't set capturedImage - navigate directly to results
      setIdentificationResult(route.params.identificationResult);
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

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Component cleanup
    };
  }, [capturedImage]);

  const getCameraPermissions = async () => {
    if (!permission?.granted) {
      await requestPermission();
    }
  };

  // Simplified image handling - no optimization
  const processImage = async (uri: string) => {
    return uri; // Return image as-is without optimization
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        setIsLoading(true);
        timer.start('camera-capture');
        logger.debug('Camera capture initiated', { zoom });

        const photo = await cameraRef.current.takePictureAsync({
          quality: 1.0,  // Maximum quality for better plant identification
          base64: false,
        });

        if (photo) {
          logger.debug('Photo captured', { uri: photo.uri, width: photo.width, height: photo.height });

          // Send directly to PlantNet API for real AI analysis
          logger.info('📸 Sending image directly to PlantNet AI');

          const processedUri = await processImage(photo.uri);
          await identifyPlant(processedUri);
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
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow photo library access');
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

        const processedUri = await processImage(imageUri);
        // Don't set capturedImage - keep camera view visible during identification
        await identifyPlant(processedUri);
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

        setIdentificationResult(result);
        logger.groupEnd();

        // Navigate to PlantResultScreen instead of showing modal
        navigation.navigate('PlantResult', {
          identificationResult: result,
          capturedImage: imageUri,
        });
      } else {
        logger.warn('No identification results returned');
        logger.groupEnd();

        // Phase 1: Simple Alert with fixed navigation
        Alert.alert(
          'No Results',
          'Could not identify this plant. Please try a clearer photo of the leaves with good lighting.',
          [
            { text: 'Try Again', onPress: () => setCapturedImage(null) },
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
          { text: 'Try Again', onPress: () => setCapturedImage(null) },
          { text: 'OK', style: 'cancel' },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const retryCapture = () => {
    setCapturedImage(null);
    setIdentificationResult(null);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.permissionText, isRTL && styles.permissionTextRTL]}>{t('scan.permissions.requesting')}</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={80} color={COLORS.primary} />
        <Text style={[styles.permissionText, isRTL && styles.permissionTextRTL]}>
          {t('scan.permissions.noAccess')}
        </Text>
        <Text style={[styles.permissionSubtext, isRTL && styles.permissionSubtextRTL]}>
          {t('scan.permissions.settingsPrompt')}
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => Linking.openSettings()}
        >
          <Text style={[styles.buttonText, isRTL && styles.buttonTextRTL]}>
            {t('scan.permissions.openSettings')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View - Always Visible */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
        zoom={zoom}
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
          <Text style={[styles.headerTitle, isRTL && styles.headerTitleRTL]}>{t('scan.title')}</Text>
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
            <Text style={[styles.controlText, isRTL && styles.controlTextRTL]}>{t('scan.instructions.gallery')}</Text>
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
            <Text style={[styles.loadingText, isRTL && styles.loadingTextRTL]}>{t('scan.analyzing')}</Text>
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
  permissionContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: FIBONACCI.XL,
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
  headerTitleRTL: {
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
  instructionTextAr: {
    fontSize: TYPOGRAPHY.SM,
    fontWeight: '400',
    color: COLORS.white,
    marginTop: FIBONACCI.XXS,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
  tipsButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: FIBONACCI.MD,
    paddingVertical: FIBONACCI.SM,
    borderRadius: FIBONACCI.LG,
  },
  // PHASE 3: Debug Test Button Styles
  debugTestButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: FIBONACCI.LG,
    paddingVertical: FIBONACCI.XXS,
    borderRadius: FIBONACCI.LG,
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  debugTestText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.XXS,
    fontWeight: '700',
    marginTop: FIBONACCI.XXS,
  },
  controlText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.XS,
    marginTop: FIBONACCI.XXS,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  controlTextRTL: {
    textAlign: 'center',
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
  permissionText: {
    fontSize: TYPOGRAPHY.LG,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: FIBONACCI.XL,
    textAlign: 'center',
  },
  permissionTextRTL: {
    textAlign: 'center',
  },
  permissionSubtext: {
    fontSize: TYPOGRAPHY.BASE,
    color: COLORS.textSecondary,
    marginTop: FIBONACCI.MD,
    textAlign: 'center',
    paddingHorizontal: FIBONACCI.XL,
    lineHeight: TYPOGRAPHY.BASE * 1.5,
  },
  permissionSubtextRTL: {
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: FIBONACCI.XXL,
    paddingVertical: FIBONACCI.LG,
    borderRadius: FIBONACCI.XL,
    marginTop: FIBONACCI.XXL,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: FIBONACCI.XL,
    paddingVertical: FIBONACCI.MD,
    borderRadius: FIBONACCI.XL,
    marginTop: FIBONACCI.LG,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.BASE,
    fontWeight: '600',
  },
  buttonTextRTL: {
    textAlign: 'center',
  },
  debugTestTextRTL: {
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: FIBONACCI.LG,
    paddingVertical: FIBONACCI.LG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.MD,
    fontWeight: '600',
    color: COLORS.text,
  },
  resultContent: {
    flex: 1,
  },
  resultContentContainer: {
    paddingHorizontal: FIBONACCI.LG,
    paddingBottom: FIBONACCI.XL,
    flexGrow: 1,
  },
  resultImage: {
    width: '100%',
    height: 200,
    borderRadius: ELEMENT_SIZES.RADIUS_LG,
    marginBottom: FIBONACCI.LG,
  },
  confidenceBadge: {
    position: 'absolute',
    top: FIBONACCI.XL,
    right: FIBONACCI.XL,
    backgroundColor: COLORS.success,
    paddingHorizontal: FIBONACCI.MD,
    paddingVertical: FIBONACCI.XS,
    borderRadius: ELEMENT_SIZES.RADIUS_LG,
  },
  confidenceText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.SM,
    fontWeight: '600',
  },
  plantInfo: {
    marginBottom: FIBONACCI.XL,
    marginTop: FIBONACCI.LG,
  },
  plantName: {
    fontSize: TYPOGRAPHY.XL,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: FIBONACCI.SM,
  },
  scientificName: {
    fontSize: TYPOGRAPHY.BASE,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    marginBottom: FIBONACCI.XXS,
  },
  familyName: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.textSecondary,
  },
  careSection: {
    marginBottom: FIBONACCI.XL,
    backgroundColor: COLORS.background,
    padding: FIBONACCI.LG,
    borderRadius: ELEMENT_SIZES.RADIUS_LG,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  careTitle: {
    fontSize: TYPOGRAPHY.MD,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: FIBONACCI.LG,
  },
  plantDescription: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.text,
    lineHeight: TYPOGRAPHY.LG,
    marginBottom: FIBONACCI.LG,
  },
  careDetails: {
    gap: FIBONACCI.MD,
  },
  careItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: FIBONACCI.SM,
  },
  careContent: {
    flex: 1,
    marginLeft: FIBONACCI.MD,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  careLabel: {
    fontSize: TYPOGRAPHY.SM,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  unlockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  unlockBullet: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginRight: 8,
    width: 20,
  },
  unlockLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '400',
  },
  bottomText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginVertical: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 16,
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  careValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  actionButtons: {
    gap: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    gap: 8,
  },
  retryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 20,
  },
  
  // Authentication Modal Styles - Beautiful popup overlay
  authModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: FIBONACCI.LG,
    width: '100%',
    maxWidth: 350,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 25,
  },
  authCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: FIBONACCI.XL,
    height: FIBONACCI.XL,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  authCloseText: {
    fontSize: 20,
    color: COLORS.textSecondary,
    fontWeight: '300',
  },
  authHeader: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  authTitle: {
    fontSize: TYPOGRAPHY.LG,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  authOptions: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  googleButton: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
  },
  appleButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  phoneButton: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary,
  },
  authButtonIcon: {
    fontSize: 18,
    fontWeight: '600',
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  authFooter: {
    alignItems: 'center',
    gap: 12,
  },
  authLegalText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  authSkipText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
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
  loadingTextRTL: {
    textAlign: 'center',
  },
});