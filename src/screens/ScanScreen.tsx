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

import { COLORS } from '../constants';
import { plantNetService } from '../services/plantnet';
import { IdentificationResult } from '../types';
import { getCurrentLanguage } from '../i18n';
import { useStore } from '../store';
import SmartCameraOverlay from '../components/SmartCameraOverlay';
import { plantDetectionService } from '../utils/plantDetection';

export default function ScanScreen({ route }: any) {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useStore();
  
  // Debug: Log current auth state
  console.log('🔍 ScanScreen - Current auth state:', { user: user?.id, isAuthenticated });
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
      setCapturedImage(route.params.capturedImage);
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
      console.log('🧹 ScanScreen unmounting...');
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
    console.log('📷 Processing image:', uri);
    return uri; // Return image as-is without optimization
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        console.log('📷 Starting smart capture process...');
        setIsLoading(true);
        
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        
        if (photo) {
          console.log('📷 Photo captured, performing validation...');
          
          // Smart validation before processing
          if (enableSmartDetection) {
            const validation = await plantNetService.validateImageForCapture(photo.uri);
            setValidationResult(validation);
            
            if (!validation.shouldCapture) {
              console.log('❌ Image validation failed:', validation.feedback);
              Alert.alert(
                'Image Quality Issue',
                validation.feedback + '\n\nTips:\n' + validation.improvements.join('\n• '),
                [
                  { text: 'Try Again', onPress: () => setIsLoading(false) },
                  { text: 'Continue Anyway', onPress: async () => {
                    const processedUri = await processImage(photo.uri);
                    setCapturedImage(processedUri);
                    await identifyPlant(processedUri);
                  }}
                ]
              );
              return;
            }
          }
          
          console.log('✅ Image validation passed, proceeding with identification...');
          const processedUri = await processImage(photo.uri);
          setCapturedImage(processedUri);
          await identifyPlant(processedUri);
        }
      } catch (error) {
        console.error('❌ Error in smart capture:', error);
        Alert.alert('Camera Error', 'Failed to take picture. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const pickImage = async () => {
    try {
      console.log('🖼️ Picking image from gallery...');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow photo library access');
        return;
      }

      setIsLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('🖼️ Image selected:', result.assets[0].uri);
        const processedUri = await processImage(result.assets[0].uri);
        setCapturedImage(processedUri);
        await identifyPlant(processedUri);
      }
    } catch (error) {
      console.error('❌ Error picking image:', error);
      Alert.alert('Gallery Error', 'Failed to pick image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const identifyPlant = async (imageUri: string) => {
    try {
      console.log('🌿 Identifying plant...');
      setIsLoading(true);
      
      // Use plant identification service
      const currentLang = getCurrentLanguage() as 'en' | 'ar';
      const result = await plantNetService.identifyPlant(imageUri, 'leaf', currentLang);
      
      if (result) {
        console.log('🌿 Plant identified successfully');
        setIdentificationResult(result);
        // Navigate to PlantResultScreen instead of showing modal
        navigation.navigate('PlantResult', {
          identificationResult: result,
          capturedImage: imageUri,
        });
      } else {
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
      console.error('❌ Error identifying plant:', error);
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
        <Text style={styles.permissionText}>{t('scan.permissions.requesting')}</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Ionicons name="camera-outline" size={64} color={COLORS.textSecondary} />
        <Text style={styles.permissionText}>{t('scan.permissions.noAccess')}</Text>
        <Text style={styles.permissionSubtext}>
          Please enable camera access in settings to identify plants
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>{t('scan.permissions.grantButton')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      {!capturedImage ? (
        // Camera View
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
            isVisible={shouldShowOverlay && !capturedImage}
            isCapturing={isLoading}
            onCapturePress={takePicture}
            onRetryPress={retryCapture}
            currentImageUri={capturedImage}
            enableRealTimeDetection={enableSmartDetection}
          />
          
          {/* Header Controls */}
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
              onPress={() => setEnableSmartDetection(!enableSmartDetection)}
            >
              <Ionicons 
                name={enableSmartDetection ? "eye" : "eye-off"} 
                size={24} 
                color={enableSmartDetection ? COLORS.primary : COLORS.white} 
              />
            </TouchableOpacity>
          </View>

          {/* Gallery and Tips Controls */}
          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
              <Ionicons name="images-outline" size={24} color={COLORS.white} />
              <Text style={styles.controlText}>{t('scan.instructions.gallery')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.tipsButton}
              onPress={() => setShouldShowOverlay(!shouldShowOverlay)}
            >
              <Ionicons name="help-circle-outline" size={24} color={COLORS.white} />
              <Text style={styles.controlText}>
                {shouldShowOverlay ? 'Hide Guide' : 'Show Guide'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Captured Image Preview
        <View style={styles.previewContainer}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={retryCapture}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: COLORS.text }]}>
              {isLoading ? t('scan.analyzing') : t('scan.results.title')}
            </Text>
            <View style={styles.headerButton} />
          </View>

          {capturedImage && <Image source={{ uri: capturedImage }} style={styles.previewImage} />}
        </View>
      )}



    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.text,
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
    paddingHorizontal: 20,
    paddingTop: 60,
    zIndex: 20,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  cameraGuide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideFrame: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: COLORS.primary,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 20,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 20,
  },
  instructions: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  instructionTextAr: {
    fontSize: 14,
    color: COLORS.white,
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  galleryButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tipsButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  controlText: {
    color: COLORS.white,
    fontSize: 12,
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.primary,
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
  },
  permissionText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 20,
    textAlign: 'center',
  },
  permissionSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  previewImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  resultContent: {
    flex: 1,
  },
  resultContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  resultImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 20,
  },
  confidenceBadge: {
    position: 'absolute',
    top: 36,
    right: 36,
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  confidenceText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  plantInfo: {
    marginBottom: 24,
    marginTop: 20,
  },
  plantName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  scientificName: {
    fontSize: 16,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  familyName: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  careSection: {
    marginBottom: 24,
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  careTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 16,
  },
  plantDescription: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 20,
  },
  careDetails: {
    gap: 12,
  },
  careItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  careContent: {
    flex: 1,
    marginLeft: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  careLabel: {
    fontSize: 14,
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
    padding: 24,
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
    width: 32,
    height: 32,
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
    fontSize: 24,
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
});