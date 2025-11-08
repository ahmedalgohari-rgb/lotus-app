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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';

import { COLORS, FIBONACCI, TYPOGRAPHY, ELEMENT_SIZES, GOLDEN_RECTANGLES } from '../constants';
import { plantNetService } from '../services/plantnet';
import { IdentificationResult } from '../types';
import { getCurrentLanguage } from '../i18n';
import { useStore } from '../store';
import SmartCameraOverlay from '../components/SmartCameraOverlay';
import { plantDetectionService } from '../utils/plantDetection';
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
  
  const [zoom, setZoom] = useState(0);
  
  // Smart detection and validation state (disabled by default for better UX)
  const [enableSmartDetection, setEnableSmartDetection] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [shouldShowOverlay, setShouldShowOverlay] = useState(true);
  
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

  // Pinch-to-zoom gesture handling
  const onPinchGestureEvent = (event: any) => {
    const { scale, state } = event.nativeEvent;
    
    if (state === State.ACTIVE) {
      // Convert scale to zoom value (0-1 range for Expo Camera)
      const newZoom = Math.min(Math.max((scale - 1) * 0.5, 0), 1);
      setZoom(newZoom);
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
        logger.debug('Camera capture initiated', { enableSmartDetection, zoom });

        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });

        if (photo) {
          logger.debug('Photo captured', { uri: photo.uri, width: photo.width, height: photo.height });

          // Smart validation before processing
          if (enableSmartDetection) {
            timer.start('image-validation');
            const validation = await plantNetService.validateImageForCapture(photo.uri);
            timer.end('image-validation');
            setValidationResult(validation);

            logger.debug('Image validation result', {
              shouldCapture: validation.shouldCapture,
              confidence: validation.confidence,
              feedback: validation.feedback
            });

            if (!validation.shouldCapture) {
              Alert.alert(
                'Image Quality Issue',
                validation.feedback + '\n\nTips:\n' + validation.improvements.join('\n• '),
                [
                  { text: 'Try Again', onPress: () => setIsLoading(false) },
                  { text: 'Continue Anyway', onPress: async () => {
                    const processedUri = await processImage(photo.uri);
                    await identifyPlant(processedUri);
                  }}
                ]
              );
              return;
            }
          }

          const processedUri = await processImage(photo.uri);
          await identifyPlant(processedUri);
          timer.end('camera-capture');
        }
      } catch (error) {
        logger.error('Error in smart capture:', error);
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
        const processedUri = await processImage(result.assets[0].uri);
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

  // PHASE 3: API Test Handler
  const testPlantNetAPI = async () => {
    try {
      Alert.alert('API Test', 'Running diagnostics...');

      const result = await plantNetService.testPlantNetAPI();

      const statusEmoji = {
        apiKey: result.apiKeyConfigured ? '✅' : '❌',
        network: result.networkReachable ? '✅' : '❌',
        authorized: result.apiAuthorized ? '✅' : '❌'
      };

      Alert.alert(
        'PlantNet API Test Results',
        `${statusEmoji.apiKey} API Key: ${result.apiKeyConfigured ? 'Configured' : 'Missing'}\n\n` +
        `${statusEmoji.network} Network: ${result.networkReachable ? 'Connected' : 'Offline'}\n\n` +
        `${statusEmoji.authorized} API Access: ${result.apiAuthorized ? 'Authorized' : 'Blocked'}\n\n` +
        `Your IP: ${result.ipAddress || 'Unknown'}\n\n` +
        `${result.errorDetails ? `⚠️ ${result.errorDetails}` : '🎉 All checks passed!'}`,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error) {
      logger.error('API test failed:', error);
      Alert.alert('Test Failed', `Error: ${error.message}`);
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

      const result = await plantNetService.identifyPlant(imageUri, 'leaf', currentLang);
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

        Alert.alert(
          'No Results',
          'Could not identify this plant. Please try a clearer photo of the leaves with good lighting.',
          [
            { text: 'Try Again', onPress: () => setCapturedImage(null) },
            { text: 'Manual Add', onPress: () => {
              // Navigate to AddPlant with mock data for manual entry
              navigation.navigate('AddPlant', {
                identificationResult: null,
                capturedImage: imageUri,
              });
            } },
            { text: 'OK', style: 'cancel' },
          ]
        );
      }
    } catch (error) {
      logger.error('Error identifying plant:', error);
      logger.groupEnd();

      Alert.alert(
        'Identification Error',
        'Network error occurred. Please check your connection and try again.',
        [
          { text: 'Try Again', onPress: () => setCapturedImage(null) },
          { text: 'Use Mock Data', onPress: async () => {
            const currentLang = getCurrentLanguage() as 'en' | 'ar';
            const mockResult = await plantNetService.mockIdentify(imageUri, currentLang);
            if (mockResult) {
              setIdentificationResult(mockResult);
              // Navigate to PlantResultScreen instead of showing modal
              navigation.navigate('PlantResult', {
                identificationResult: mockResult,
                capturedImage: imageUri,
              });
            }
          }},
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
      <View style={styles.container}>
        <Ionicons name="camera-outline" size={64} color={COLORS.textSecondary} />
        <Text style={[styles.permissionText, isRTL && styles.permissionTextRTL]}>{t('scan.permissions.noAccess')}</Text>
        <Text style={[styles.permissionSubtext, isRTL && styles.permissionSubtextRTL]}>
          {t('scan.permissions.settingsPrompt')}
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={[styles.buttonText, isRTL && styles.buttonTextRTL]}>{t('scan.permissions.grantButton')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Camera View - Always Visible */}
      <View style={styles.cameraContainer}>
        <PinchGestureHandler onGestureEvent={onPinchGestureEvent}>
          <View style={styles.camera}>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing={cameraType}
              zoom={zoom}
            />
          </View>
        </PinchGestureHandler>

        {/* Enhanced Smart Camera Overlay */}
        <SmartCameraOverlay
          isVisible={shouldShowOverlay && !isLoading}
          isCapturing={isLoading}
          onCapturePress={takePicture}
          onRetryPress={retryCapture}
          currentImageUri={capturedImage}
          enableRealTimeDetection={enableSmartDetection}
        />

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
              onPress={() => setEnableSmartDetection(!enableSmartDetection)}
            >
              <Ionicons
                name={enableSmartDetection ? "eye" : "eye-off"}
                size={24}
                color={enableSmartDetection ? COLORS.primary : COLORS.white}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Gallery and Tips Controls - Hidden during loading */}
        {!isLoading && (
          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
              <Ionicons name="images-outline" size={24} color={COLORS.white} />
              <Text style={[styles.controlText, isRTL && styles.controlTextRTL]}>{t('scan.instructions.gallery')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tipsButton}
              onPress={() => setShouldShowOverlay(!shouldShowOverlay)}
            >
              <Ionicons name="help-circle-outline" size={24} color={COLORS.white} />
              <Text style={[styles.controlText, isRTL && styles.controlTextRTL]}>
                {shouldShowOverlay ? t('scan.instructions.hideGuide') : t('scan.instructions.showGuide')}
              </Text>
            </TouchableOpacity>

            {/* PHASE 3: API Test Button (Dev Only) */}
            {__DEV__ && (
              <TouchableOpacity style={styles.debugTestButton} onPress={testPlantNetAPI}>
                <Ionicons name="bug-outline" size={24} color={COLORS.primary} />
                <Text style={[styles.debugTestText, isRTL && styles.debugTestTextRTL]}>🧪 API Test</Text>
              </TouchableOpacity>
            )}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraContainer: {
    flex: 1,
    width: '100%',
  },
  camera: {
    flex: 1,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: FIBONACCI.LG,
    paddingTop: FIBONACCI.XXL,
    zIndex: 20,
  },
  bottomControls: {
    position: 'absolute',
    bottom: FIBONACCI.XL,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: FIBONACCI.XL,
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
    fontSize: TYPOGRAPHY.MD,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
  },
  headerTitleRTL: {
    textAlign: 'center',
  },
  cameraGuide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideFrame: {
    width: GOLDEN_RECTANGLES.LARGE.width,
    height: GOLDEN_RECTANGLES.LARGE.width,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: FIBONACCI.XL,
    height: FIBONACCI.XL,
    borderColor: COLORS.primary,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: FIBONACCI.LG,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: FIBONACCI.LG,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: FIBONACCI.LG,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: FIBONACCI.LG,
  },
  instructions: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: TYPOGRAPHY.BASE,
    fontWeight: '500',
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  instructionTextAr: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.white,
    marginTop: FIBONACCI.XXS,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  controls: {
    position: 'absolute',
    bottom: FIBONACCI.XL,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: FIBONACCI.XL,
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
    width: FIBONACCI.XXXL,
    height: FIBONACCI.XXXL,
    borderRadius: FIBONACCI.XL,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.primary,
  },
  captureInner: {
    width: FIBONACCI.XXL,
    height: FIBONACCI.XXL,
    borderRadius: FIBONACCI.XL,
    backgroundColor: COLORS.primary,
  },
  permissionText: {
    fontSize: TYPOGRAPHY.MD,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: FIBONACCI.LG,
    textAlign: 'center',
  },
  permissionTextRTL: {
    textAlign: 'center',
  },
  permissionSubtext: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.textSecondary,
    marginTop: FIBONACCI.SM,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  permissionSubtextRTL: {
    textAlign: 'center',
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