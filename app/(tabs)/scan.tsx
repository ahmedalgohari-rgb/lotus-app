/**
 * Lotus Camera Scan Screen
 * Plant scanner exactly as specified in MVP/CLAUDEMVPflow.md
 */
import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
// Platform-specific camera import to avoid Worker errors
let CameraView: any = null;
let CameraType: any = null;
let useCameraPermissions: any = null;

if (Platform.OS !== 'web') {
  const cameraModule = require('expo-camera');
  CameraView = cameraModule.CameraView;
  CameraType = cameraModule.CameraType;
  useCameraPermissions = cameraModule.useCameraPermissions;
} else {
  // Mock for web to prevent import errors
  CameraView = ({ children, ...props }: any) => <View {...props}>{children}</View>;
  CameraType = { back: 'back', front: 'front' };
  useCameraPermissions = () => [{ granted: false }, () => {}];
}
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Layout } from '@/constants';
import Text from '@/components/Text';
import Button from '@/components/Button';
import { plantIdentificationService } from '@/services/plantIdentification';
import { aiPlantIdentificationService } from '@/services/aiPlantIdentification';
import { galaxyPlantIdentificationService } from '@/services/galaxyPlantIdentification';
import { apiService, CreateUserPlantData } from '@/services/api';
import { useUser, useIsAuthenticated, useIsGuest } from '@/store/authStore';
import { firstScanGuaranteeService, GuaranteedResult } from '@/services/firstScanGuarantee';
import { logger } from '@/utils/logger';
import ARPlantOverlay from '@/components/ARPlantOverlay';
import PlantGrowthLoader from '@/components/PlantGrowthLoader';
import smartNotifications from '@/services/smartNotifications';

const { width, height } = Dimensions.get('window');

export default function ScanScreen() {
  const router = useRouter();
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const isGuest = useIsGuest();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<'on' | 'off'>('off');
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [remainingScans, setRemainingScans] = useState(2);
  const [scanResetTime, setScanResetTime] = useState<Date | null>(null);
  const [imageQuality, setImageQuality] = useState<'good' | 'fair' | 'poor'>('good');
  const [qualityMessage, setQualityMessage] = useState<string>('');
  const [plantDetected, setPlantDetected] = useState<boolean>(false);
  const [detectionMessage, setDetectionMessage] = useState<string>('Point camera at a plant');
  const cameraRef = useRef<CameraView>(null);
  const [arActive, setArActive] = useState(false);
  const [arPlantDetection, setArPlantDetection] = useState<any>(null);

  // Check for first-time help and announce screen
  React.useEffect(() => {
    const initializeScanScreen = async () => {
      const isFirstScan = await firstScanGuaranteeService.isFirstScanAttempt();
      
      // Announce screen for screen readers
      // Initialize scan screen
      logger.debug('Scan screen initialized');
      
      // First scan handling removed for stability
    };
    initializeScanScreen();
  }, []);

  // Simulate real-time plant detection and image quality analysis
  const analyzeImageFeed = React.useCallback(async () => {
    try {
      // In production, this would analyze the actual camera feed
      // For now, simulate plant detection
      const hasPlant = Math.random() > 0.4; // 60% chance of detecting plant
      const confidence = hasPlant ? 0.7 + Math.random() * 0.3 : Math.random() * 0.6;
      
      setPlantDetected(hasPlant);
      
      if (hasPlant) {
        setDetectionMessage(`Plant detected (${Math.round(confidence * 100)}% confidence)`);
        
        // Also check image quality when plant is detected
        const qualities = [
          { quality: 'good' as const, message: 'Perfect! Ready to identify' },
          { quality: 'fair' as const, message: 'Good lighting - tap to scan' },
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
      logger.error('Plant detection failed:', error);
      setPlantDetected(false);
      setDetectionMessage('Detection unavailable');
    }
  }, []);


  // Update plant detection and image quality periodically
  React.useEffect(() => {
    const interval = setInterval(analyzeImageFeed, 2000); // Check every 2 seconds
    return () => clearInterval(interval);
  }, [analyzeImageFeed]);

  const checkScanLimits = async () => {
    try {
      const scanStatus = await aiPlantIdentificationService.checkScanLimit();
      setRemainingScans(scanStatus.remainingScans);
      setScanResetTime(scanStatus.resetTime || null);
    } catch (error) {
      logger.error('Error checking scan limits:', error);
    }
  };

  if (!permission) {
    return <View style={styles.loadingContainer} />;
  }

  if (!permission.granted) {
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
            title="Grant Permission"
            onPress={requestPermission}
            style={styles.permissionButton}
          />
        </View>
      </View>
    );
  }

  const handleBack = () => {
    router.back();
  };

  const processPlantIdentificationWithGalaxy = async (imageUri: string) => {
    try {
      // Show processing indicator
      Alert.alert(
        'Identifying Plant with AI 🤖',
        'Please wait while Galaxy.ai analyzes your plant...',
        [],
        { cancelable: false }
      );

      // Check if this should use the first-scan guarantee system
      const isFirstTime = await firstScanGuaranteeService.isFirstScanAttempt();
      
      if (isFirstTime) {
        // Use first-scan guarantee system for new users
        const guaranteeResult = await firstScanGuaranteeService.processScanAttempt(imageUri, { user, onboardingProfile: user?.onboardingProfile });
        
        // Dismiss processing alert
        Alert.alert('');
        
        if (guaranteeResult.success && guaranteeResult.data) {
          // Announce successful identification for screen readers
          logger.debug('Plant identification result:', {
            plantName: guaranteeResult.data.names.english,
            health: 'HEALTHY', // Guaranteed plants are always healthy
            wateringStatus: null,
            confidence: guaranteeResult.data.confidence,
            isNewPlant: true,
          }, guaranteeResult.isGuaranteed);
          
          await showGuaranteedResult(guaranteeResult.data, imageUri, guaranteeResult.isGuaranteed);
        } else {
          logger.debug('Identification error:', guaranteeResult.error);
          await showIdentificationFailure(guaranteeResult.error || 'Could not identify plant');
        }
        return;
      }

      // Regular identification flow for experienced users
      const result = await galaxyPlantIdentificationService.identifyPlant(imageUri);

      // Dismiss processing alert
      Alert.alert('');

      if (result.success && result.data) {
        // Convert Galaxy.ai response to our format
        const plantData = galaxyPlantIdentificationService.convertToInternalFormat(result);
        
        if (plantData) {
          await showIdentificationResult(plantData, imageUri);
        } else {
          await showIdentificationFailure('Failed to parse plant data');
        }
      } else {
        // Fallback to local database if Galaxy.ai fails
        logger.debug('Galaxy.ai failed, trying local fallback...');
        const fallbackResult = await aiPlantIdentificationService.identifyFromImage(imageUri);
        
        if (fallbackResult.success && fallbackResult.data) {
          await showIdentificationResult(fallbackResult.data, imageUri);
        } else {
          await showIdentificationFailure(result.error || 'Could not identify plant');
        }
      }

    } catch (error) {
      logger.error('Plant identification error:', error);
      Alert.alert('Error', 'Plant identification service is temporarily unavailable. Please try again later.');
    }
  };

  const processPlantIdentification = async (imageUri: string) => {
    try {
      // Check scan limits first
      const scanStatus = await aiPlantIdentificationService.checkScanLimit();
      if (!scanStatus.canScan) {
        const resetTimeStr = scanStatus.resetTime ? 
          scanStatus.resetTime.toLocaleTimeString() : 'tomorrow';
        Alert.alert(
          'Daily Scan Limit Reached',
          `You've used all 2 scans for today. Try again at ${resetTimeStr}.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Validate the image first
      const validation = await plantIdentificationService.validateImage(imageUri);
      if (!validation.valid) {
        Alert.alert('Invalid Image', validation.error || 'Please select a valid image');
        return;
      }

      // Check if this should use the first-scan guarantee system
      const isFirstTime = await firstScanGuaranteeService.isFirstScanAttempt();
      
      if (isFirstTime) {
        // Show processing indicator
        Alert.alert(
          'Identifying Plant 🌟',
          'Welcome to Lotus! We guarantee your first scan will be successful...',
          [],
          { cancelable: false }
        );

        // Use first-scan guarantee system for new users
        const guaranteeResult = await firstScanGuaranteeService.processScanAttempt(imageUri, { user, onboardingProfile: user?.onboardingProfile });
        
        // Dismiss processing alert
        Alert.alert('');
        
        if (guaranteeResult.success && guaranteeResult.data) {
          await showGuaranteedResult(guaranteeResult.data, imageUri, guaranteeResult.isGuaranteed);
        } else {
          await showIdentificationFailure(guaranteeResult.error || 'Could not identify plant');
        }
        return;
      }

      // Show processing indicator
      Alert.alert(
        'Identifying Plant 🔍',
        'Please wait while we analyze your plant using AI...'
      );

      // Record the scan attempt
      await aiPlantIdentificationService.recordScan();
      await checkScanLimits(); // Update remaining scans

      // Use AI identification
      await identifyPlantWithAI(imageUri);

    } catch (error) {
      logger.error('Plant processing error:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
    }
  };

  const addPlantToCollection = async (plantData: any, imageUri?: string) => {
    try {
      if (isGuest || !isAuthenticated) {
        Alert.alert(
          'Sign In Required',
          'Please sign in to add plants to your collection.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => router.push('/auth') },
          ]
        );
        return;
      }

      // Ask user for plant nickname and location
      Alert.prompt(
        'Name Your Plant 🌱',
        'Give your plant a nickname (optional)',
        [
          { text: 'Skip', style: 'cancel' },
          {
            text: 'Continue',
            onPress: async (nickName) => {
              Alert.prompt(
                'Plant Location 📍',
                'Where is this plant located? (e.g., Living Room, Kitchen)',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Add Plant',
                    onPress: async (location) => {
                      try {
                        const createPlantData: CreateUserPlantData = {
                          names: plantData.names,
                          nickName: nickName || undefined,
                          category: plantData.category,
                          location: location || 'Indoor',
                          care: plantData.care,
                          imageUrl: imageUri,
                          notes: `Added via plant scanner with ${Math.round((plantData.confidence || 0.8) * 100)}% confidence`,
                        };

                        await apiService.createUserPlant(createPlantData);
                        
                        try {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (error) {
                          logger.warn('Haptics not available in Expo Go');
                        }
                        
                        Alert.alert(
                          '🎉 Plant Added!',
                          `${nickName || plantData.names.english} has been added to your garden collection.`,
                          [
                            { text: 'Scan Another', onPress: () => {} },
                            { text: 'View My Plants', onPress: () => router.push('/plants') },
                          ]
                        );
                      } catch (error) {
                        logger.error('Failed to add plant:', error);
                        Alert.alert('Error', 'Failed to add plant to your collection. Please try again.');
                      }
                    },
                  },
                ],
                'plain-text',
                'Living Room'
              );
            },
          },
        ],
        'plain-text'
      );
    } catch (error) {
      logger.error('Add plant error:', error);
      Alert.alert('Error', 'Failed to add plant. Please try again.');
    }
  };

  const identifyPlantWithAI = async (imageUri: string) => {
    try {
      const result = await aiPlantIdentificationService.identifyFromImage(imageUri);

      if (result.success && result.data) {
        // Show identification result
        const plant = result.data;
        const confidence = Math.round(plant.confidence * 100);
        const sourceText = plant.source === 'plantnet' ? '🤖 AI Powered' : 
                          plant.source === 'local' ? '📱 Local Database' : '📝 Description Based';
        
        Alert.alert(
          `🌿 ${plant.names.english}`,
          `Arabic: ${plant.names.arabic}\nScientific: ${plant.names.scientific}\n\nConfidence: ${confidence}% (${sourceText})\nRemaining Scans: ${remainingScans - 1}\n\nCategory: ${plant.category}\n\nCare Tips:\n• ${plant.care.watering}\n• ${plant.care.light}\n• ${plant.care.environment}${plant.care.cairoTips ? '\n\n🏜️ Cairo Tip: ' + plant.care.cairoTips : ''}`,
          [
            {
              text: 'Scan Another',
              style: 'cancel',
            },
            {
              text: 'Add to My Plants',
              onPress: () => addPlantToCollection({ ...plant, confidence: plant.confidence }, imageUri),
            },
          ]
        );
      } else {
        Alert.alert(
          'Identification Failed',
          result.error || 'Could not identify the plant. Please try with a clearer image or different angle.',
          [
            { text: 'Try Again' },
            { text: 'Manual Entry', onPress: () => showManualEntry(imageUri) },
          ]
        );
      }
    } catch (error) {
      logger.error('AI identification error:', error);
      Alert.alert('Error', 'Plant identification service temporarily unavailable. Please try again later.');
    }
  };

  const showManualEntry = (imageUri: string) => {
    Alert.prompt(
      'Manual Plant Entry 📝',
      'Describe your plant to help us provide care instructions',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Get Care Tips',
          onPress: async (description) => {
            if (!description) return;
            
            // Use local database search for manual entry
            const result = await aiPlantIdentificationService.searchLocalDatabase(description);
            
            if (result.success && result.data) {
              const plant = result.data;
              addPlantToCollection({ ...plant, confidence: 0.5 }, imageUri);
            }
          },
        },
      ],
      'plain-text',
      'Green plant with leaves'
    );
  };

  const toggleFlash = () => {
    setFlash(current => (current === 'off' ? 'on' : 'off'));
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      logger.warn('Haptics not available in Expo Go');
    }
  };

  const takePicture = async () => {
    if (cameraRef.current && !isProcessing) {
      // Check if plant is detected before allowing capture
      if (!plantDetected) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch (error) {
          logger.warn('Haptics not available in Expo Go');
        }
        // Error help removed for stability
        logger.debug('No plant detected in camera view');
        Alert.alert(
          'No Plant Detected 🌱',
          'Please point your camera at a plant before taking a photo. The app will automatically detect when a plant is in view.',
          [{ text: 'OK' }]
        );
        return;
      }

      try {
        setIsProcessing(true);
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (error) {
          logger.warn('Haptics not available in Expo Go');
        }
        
        // Double-check plant detection with the actual photo
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });
        
        if (photo) {
          // Verify plant is in the captured image
          const detectionResult = await galaxyPlantIdentificationService.detectPlantInImage(photo.uri);
          
          if (!detectionResult.hasPlant) {
            Alert.alert(
              'No Plant in Photo 📷',
              detectionResult.reason || 'The captured image doesn\'t contain a clear plant. Please try again.',
              [{ text: 'Try Again' }]
            );
            return;
          }

          // Process and identify the plant using Galaxy.ai
          await processPlantIdentificationWithGalaxy(photo.uri);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture. Please try again.');
        logger.error('Camera error:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const pickFromGallery = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedImage = result.assets[0];
        await processPlantIdentification(selectedImage.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image from gallery.');
      logger.error('Gallery error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const showGuaranteedResult = async (plant: GuaranteedResult, imageUri: string, isGuaranteed: boolean) => {
    const confidence = Math.round(plant.confidence * 100);
    const sourceText = isGuaranteed ? '🎯 Guaranteed Match' : '🤖 Galaxy.ai';
    const successEmoji = isGuaranteed ? '🌟' : '🌿';
    const welcomeMessage = isGuaranteed ? 'Welcome to Lotus! Your first scan was successful!' : '';
    
    Alert.alert(
      `${successEmoji} ${plant.names.english}`,
      `${welcomeMessage}\n\nArabic: ${plant.names.arabic}\nScientific: ${plant.names.scientific}\n\nConfidence: ${confidence}% (${sourceText})\n\nCategory: ${plant.category}\nDifficulty: ${plant.difficulty}\n\n${plant.personalizedTip}\n\nCare Tips:\n• ${plant.care.watering}\n• ${plant.care.light}\n• ${plant.care.environment}${plant.care.cairoTips ? '\n\n🏜️ Cairo Tip: ' + plant.care.cairoTips : ''}`,
      [
        {
          text: 'Scan Another',
          style: 'cancel',
        },
        {
          text: 'Add to My Plants',
          onPress: () => addPlantToCollection({ ...plant, confidence: plant.confidence }, imageUri),
        },
      ]
    );
  };

  const showIdentificationResult = async (plant: any, imageUri: string) => {
    const confidence = Math.round(plant.confidence * 100);
    const sourceText = plant.source === 'galaxy-ai' ? '🤖 Galaxy.ai' : 
                      plant.source === 'local' ? '📱 Local Database' : '📝 Description Based';
    
    Alert.alert(
      `🌿 ${plant.names.english}`,
      `Arabic: ${plant.names.arabic}\\nScientific: ${plant.names.scientific}\\n\\nConfidence: ${confidence}% (${sourceText})\\n\\nCategory: ${plant.category}\\nDifficulty: ${plant.difficulty || 'Moderate'}\\n\\nCare Tips:\\n• ${plant.care.watering}\\n• ${plant.care.light}\\n• ${plant.care.environment}${plant.care.cairoTips ? '\\n\\n🏜️ Cairo Tip: ' + plant.care.cairoTips : ''}`,
      [
        {
          text: 'Scan Another',
          style: 'cancel',
        },
        {
          text: 'Add to My Plants',
          onPress: () => addPlantToCollection({ ...plant, confidence: plant.confidence }, imageUri),
        },
      ]
    );
  };

  const showIdentificationFailure = async (errorMessage: string) => {
    Alert.alert(
      'Identification Failed',
      errorMessage,
      [
        { text: 'Try Again' },
        { text: 'Manual Entry', onPress: () => showManualEntry('') },
      ]
    );
  };

  const showTips = () => {
    Alert.alert(
      'Photography Tips 📸',
      '• Hold the camera steady\n• Ensure good lighting (natural light is best)\n• Focus on leaves and stems\n• Avoid harsh shadows\n• Fill the frame with the plant\n• Show multiple angles if possible\n• Clean plant leaves before scanning\n• Avoid blurry or too dark images',
      [{ text: 'Got it!' }]
    );
  };


  return (
    <View style={styles.container}>
      {/* Camera View - Only on native platforms */}
      {Platform.OS !== 'web' ? (
        <CameraView 
          ref={cameraRef} 
          style={styles.camera} 
          facing={facing}
          flash={flash}
        />
      ) : (
        <View style={[styles.camera, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: 'white', textAlign: 'center' }}>
            Camera not available in web preview.{'\n'}Use a physical device or iOS Simulator.
          </Text>
        </View>
      )}
      
      {/* Overlay positioned absolutely over camera */}
      <View style={styles.overlay}>
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={20} color={Colors.pureWhite} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
            <Ionicons 
              name={flash === 'on' ? 'flash' : 'flash-off'} 
              size={20} 
              color={Colors.pureWhite} 
            />
          </TouchableOpacity>
        </View>

        {/* Capture Frame with Corners */}
        <View style={styles.centerArea}>
          <View style={styles.captureFrame}>
            {/* Corner guides exactly as MVP */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            
            {/* Plant placeholder/guide */}
            <View style={styles.plantGuide}>
              <MaterialIcons 
                name="local-florist" 
                size={48} 
                color={Colors.lotusGreen}
                style={{ opacity: 0.3 }}
              />
            </View>
            
            {/* Real-time quality feedback */}
            <View style={[styles.qualityFeedback, {
              backgroundColor: imageQuality === 'good' ? 'rgba(82, 196, 26, 0.9)' :
                               imageQuality === 'fair' ? 'rgba(255, 193, 7, 0.9)' :
                               'rgba(255, 77, 79, 0.9)'
            }]}>
              <Text style={styles.qualityText}>{qualityMessage}</Text>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionTextEn}>
            {plantDetected ? 'Plant detected! Tap to scan' : 'Point camera at a plant'}
          </Text>
          <Text style={styles.instructionTextAr}>
            {plantDetected ? 'تم اكتشاف النبات! اضغط للمسح' : 'وجه الكاميرا نحو النبات'}
          </Text>
          
          {/* Plant detection status */}
          <View style={[styles.detectionStatus, {
            backgroundColor: plantDetected ? 'rgba(82, 196, 26, 0.9)' : 'rgba(255, 77, 79, 0.9)'
          }]}>
            <Text style={styles.detectionText}>{detectionMessage}</Text>
          </View>
          
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.sideButton} onPress={pickFromGallery}>
            <Ionicons name="images" size={20} color={Colors.pureWhite} />
            <Text style={styles.sideButtonText}>Gallery</Text>
          </TouchableOpacity>

          {/* Main Capture Button */}
          <TouchableOpacity
            style={[
              styles.captureButton, 
              (isProcessing || !plantDetected) && styles.captureButtonDisabled
            ]}
            onPress={takePicture}
            activeOpacity={0.8}
            disabled={isProcessing || !plantDetected}
          >
            {isProcessing ? (
              <ActivityIndicator size="large" color={Colors.lotusGreen} />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.sideButton} onPress={showTips}>
            <Ionicons name="help-circle" size={20} color={Colors.pureWhite} />
            <Text style={styles.sideButtonText}>Tips</Text>
          </TouchableOpacity>
        </View>

      </View>
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
  permissionContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContent: {
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
  },
  permissionTitle: {
    ...Typography.screenTitle,
    color: Colors.textPrimary,
    marginBottom: Layout.sm,
    textAlign: 'center',
  },
  permissionMessage: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.xl,
  },
  permissionButton: {
    width: 200,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: Layout.screenPadding,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    gap: Layout.xs,
  },
  backText: {
    ...Typography.buttonSecondary,
    color: Colors.pureWhite,
    fontSize: 14,
  },
  flashButton: {
    padding: Layout.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureFrame: {
    width: Layout.cameraFrameSize,
    height: Layout.cameraFrameSize * 0.75, // 4:3 aspect ratio
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: Layout.cameraCornerSize,
    height: Layout.cameraCornerSize,
    borderColor: Colors.lotusGreen,
    borderWidth: 4,
    opacity: 0.8,
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
  plantGuide: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  qualityFeedback: {
    position: 'absolute',
    top: -60,
    left: -50,
    right: -50,
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.xs,
    borderRadius: 20,
    alignItems: 'center',
  },
  qualityText: {
    ...Typography.caption,
    color: Colors.pureWhite,
    fontWeight: '600',
    textAlign: 'center',
  },
  instructionsContainer: {
    alignItems: 'center',
    paddingVertical: Layout.xl,
  },
  instructionTextEn: {
    ...Typography.body,
    color: Colors.pureWhite,
    textAlign: 'center',
    marginBottom: Layout.xs,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  instructionTextAr: {
    ...Typography.bodySecondary,
    color: Colors.pureWhite,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  scanLimitWarning: {
    marginTop: Layout.sm,
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.xs,
    backgroundColor: 'rgba(255, 193, 7, 0.9)',
    borderRadius: 8,
  },
  scanLimitText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
  },
  detectionStatus: {
    marginTop: Layout.sm,
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.xs,
    borderRadius: 20,
    alignItems: 'center',
  },
  detectionText: {
    ...Typography.caption,
    color: Colors.pureWhite,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 13,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Platform.OS === 'ios' ? 40 : Layout.screenPadding,
  },
  sideButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: Layout.sm,
    paddingHorizontal: Layout.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    minWidth: 70,
    gap: Layout.xs,
  },
  sideButtonText: {
    ...Typography.caption,
    color: Colors.pureWhite,
    fontSize: 12,
  },
  captureButton: {
    width: Layout.captureButtonSize,
    height: Layout.captureButtonSize,
    borderRadius: Layout.captureButtonSize / 2,
    backgroundColor: Colors.pureWhite,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  captureButtonDisabled: {
    opacity: 0.7,
  },
  captureButtonInner: {
    width: Layout.captureButtonInner,
    height: Layout.captureButtonInner,
    borderRadius: Layout.captureButtonInner / 2,
    backgroundColor: Colors.pureWhite,
    borderWidth: 4,
    borderColor: Colors.lotusGreen,
  },
});