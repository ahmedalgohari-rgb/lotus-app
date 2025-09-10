import React, { FC, useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Camera, CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { Colors, Layout, Typography, Spacing } from '@/constants';
import { Button, ScreenTitle } from '@/components';
import { getResponsiveLayout } from '@/utils/responsive';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

interface CameraScreenProps {}

export const CameraScreen: FC<CameraScreenProps> = () => {
  const navigation = useNavigation();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const responsiveLayout = getResponsiveLayout();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleCapturePhoto = async (): Promise<void> => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      if (photo) {
        // Navigate to plant result screen with captured image
        // navigation.navigate('PlantResult', { 
        //   imageUri: photo.uri,
        //   identificationData: null 
        // });
        
        // For now, show success alert
        Alert.alert(
          'Photo Captured!',
          'Plant identification will be implemented next.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const toggleCameraFacing = (): void => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleGoBack = (): void => {
    navigation.goBack();
  };

  // Show permission request if needed
  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <ScreenTitle style={styles.permissionTitle}>
          Camera Access Required
        </ScreenTitle>
        <Text style={styles.permissionMessage}>
          Lotus needs camera access to identify your plants
        </Text>
        <Text style={styles.permissionMessageAr}>
          يحتاج لوتس إلى الوصول للكاميرا لتحديد نباتاتك
        </Text>
        <Button
          title="Grant Permission"
          onPress={requestPermission}
          style={styles.permissionButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      >
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Scan Plant</Text>
          <Text style={styles.headerTitleAr}>مسح النبتة</Text>
          
          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCameraFacing}
          >
            <Text style={styles.flipButtonText}>🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Camera Overlay Frame */}
        <View style={styles.overlay}>
          {/* Top overlay */}
          <View style={styles.overlayTop} />
          
          {/* Middle section with frame */}
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            
            {/* Camera Frame */}
            <View style={styles.cameraFrame}>
              {/* Corner indicators */}
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
              
              {/* Center guidance */}
              <View style={styles.centerGuide}>
                <Text style={styles.guideText}>
                  Position plant in frame
                </Text>
                <Text style={styles.guideTextAr}>
                  ضع النبتة في الإطار
                </Text>
              </View>
            </View>
            
            <View style={styles.overlaySide} />
          </View>
          
          {/* Bottom overlay */}
          <View style={styles.overlayBottom} />
        </View>

        {/* Bottom Controls */}
        <View style={styles.controls}>
          <View style={styles.controlsInner}>
            {/* Tips */}
            <View style={styles.tips}>
              <Text style={styles.tipText}>
                💡 Point camera at leaves for best results
              </Text>
              <Text style={styles.tipTextAr}>
                💡 وجه الكاميرا على الأوراق للحصول على أفضل النتائج
              </Text>
            </View>
            
            {/* Capture Button */}
            <View style={styles.captureButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.captureButton,
                  isCapturing && styles.captureButtonPressed
                ]}
                onPress={handleCapturePhoto}
                disabled={isCapturing}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.textPrimary,
  },
  camera: {
    flex: 1,
  },
  
  // Permission styles
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Layout.screenPadding * 2,
  },
  permissionTitle: {
    textAlign: 'center',
    marginBottom: Layout.sectionSpacing,
    color: Colors.lotusGreen,
  },
  permissionText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.sectionSpacing,
  },
  permissionMessage: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.sm,
  },
  permissionMessageAr: {
    ...Typography.arabicTitle,
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.sectionSpacing * 2,
  },
  permissionButton: {
    minWidth: 200,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: StatusBar.currentHeight || Layout.screenPadding * 2,
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Layout.screenPadding,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backButton: {
    width: Layout.buttonHeightSmall,
    height: Layout.buttonHeightSmall,
    borderRadius: Layout.buttonHeightSmall / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: Colors.pureWhite,
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    ...Typography.sectionHeader,
    color: Colors.pureWhite,
    textAlign: 'center',
  },
  headerTitleAr: {
    ...Typography.arabicTitle,
    fontSize: Typography.sectionHeader.fontSize,
    color: Colors.pureWhite,
    textAlign: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 60,
  },
  flipButton: {
    width: Layout.buttonHeightSmall,
    height: Layout.buttonHeightSmall,
    borderRadius: Layout.buttonHeightSmall / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButtonText: {
    fontSize: 20,
  },
  
  // Overlay styles
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: SCREEN_WIDTH * 0.8, // Square frame
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Camera frame styles
  cameraFrame: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: Layout.compassDirectionSize,
    height: Layout.compassDirectionSize,
    borderColor: Colors.pureWhite,
    borderWidth: 3,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  
  // Center guide styles
  centerGuide: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Layout.sm,
    borderRadius: Layout.cardRadiusSmall,
    alignItems: 'center',
  },
  guideText: {
    ...Typography.bodySecondary,
    color: Colors.pureWhite,
    textAlign: 'center',
    marginBottom: Layout.xs,
  },
  guideTextAr: {
    ...Typography.arabicTitle,
    fontSize: Typography.bodySecondary.fontSize,
    color: Colors.pureWhite,
    textAlign: 'center',
  },
  
  // Controls styles
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  controlsInner: {
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Layout.sectionSpacing,
    alignItems: 'center',
  },
  tips: {
    alignItems: 'center',
    marginBottom: Layout.screenPadding,
  },
  tipText: {
    ...Typography.caption,
    color: Colors.pureWhite,
    textAlign: 'center',
    marginBottom: Layout.xs / 2,
  },
  tipTextAr: {
    ...Typography.arabicTitle,
    fontSize: Typography.caption.fontSize,
    color: Colors.pureWhite,
    textAlign: 'center',
  },
  
  // Capture button styles
  captureButtonContainer: {
    alignItems: 'center',
  },
  captureButton: {
    width: Layout.captureButtonSize,
    height: Layout.captureButtonSize,
    borderRadius: Layout.captureButtonSize / 2,
    backgroundColor: Colors.pureWhite,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  captureButtonPressed: {
    backgroundColor: Colors.lotusGreen,
  },
  captureButtonInner: {
    width: Layout.captureButtonInner,
    height: Layout.captureButtonInner,
    borderRadius: Layout.captureButtonInner / 2,
    backgroundColor: Colors.lotusGreen,
  },
});

export default CameraScreen;