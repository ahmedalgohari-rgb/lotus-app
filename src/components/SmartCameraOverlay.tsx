/**
 * SmartCameraOverlay Component
 * Real-time plant detection feedback overlay for camera interface
 * Provides intelligent guidance for optimal plant photography
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { COLORS } from '../constants';
import { PlantDetectionResult, plantDetectionService } from '../utils/plantDetection';
import { plantNetService } from '../services/plantnet';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SmartCameraOverlayProps {
  isVisible: boolean;
  isCapturing: boolean;
  onCapturePress: () => void;
  onRetryPress?: () => void;
  currentImageUri?: string;
  enableRealTimeDetection?: boolean;
}

interface CaptureButtonState {
  enabled: boolean;
  color: string;
  text: string;
  icon: string;
  pulse: boolean;
}

export default function SmartCameraOverlay({
  isVisible,
  isCapturing,
  onCapturePress,
  onRetryPress,
  currentImageUri,
  enableRealTimeDetection = true
}: SmartCameraOverlayProps) {
  const { t } = useTranslation();
  
  // Detection state
  const [detectionResult, setDetectionResult] = useState<PlantDetectionResult | null>(null);
  const [captureButtonState, setCaptureButtonState] = useState<CaptureButtonState>({
    enabled: true,
    color: COLORS.primary,
    text: 'Tap to Capture',
    icon: 'camera',
    pulse: false
  });
  
  // Feedback state
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [feedbackColor, setFeedbackColor] = useState<string>(COLORS.textSecondary);
  const [qualityTips, setQualityTips] = useState<string[]>([]);
  
  // Animation values
  const [pulseAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));
  
  /**
   * Real-time plant detection loop - DISABLED
   * Note: Expo Camera doesn't provide real-time frame access by default
   * Detection runs post-capture instead
   */
  const performRealTimeDetection = useCallback(async () => {
    // Real-time detection is disabled - button is always enabled
    // Smart validation happens after capture in ScanScreen.tsx
    return;
  }, []);

  /**
   * Update camera feedback based on validation results
   */
  const updateCameraFeedback = (validation: any) => {
    setFeedbackMessage(validation.feedback);
    setQualityTips(validation.improvements);
    
    // Set feedback color based on confidence
    if (validation.confidence > 0.7) {
      setFeedbackColor(COLORS.success);
    } else if (validation.confidence > 0.4) {
      setFeedbackColor(COLORS.warning);
    } else {
      setFeedbackColor(COLORS.error);
    }
  };

  /**
   * Update capture button state based on plant detection
   */
  const updateCaptureButton = (detection: PlantDetectionResult) => {
    let newState: CaptureButtonState;
    
    if (!detection.isPlantDetected) {
      newState = {
        enabled: false,
        color: COLORS.lightGray,
        text: 'Searching for plant...',
        icon: 'search-outline',
        pulse: false
      };
    } else if (detection.confidence < 0.4) {
      newState = {
        enabled: false,
        color: COLORS.warning,
        text: 'Plant unclear, adjust position',
        icon: 'warning-outline',
        pulse: false
      };
    } else if (detection.confidence < 0.6) {
      newState = {
        enabled: true,
        color: COLORS.warning,
        text: 'Fair quality - tap to capture',
        icon: 'camera-outline',
        pulse: false
      };
    } else if (detection.confidence < 0.8) {
      newState = {
        enabled: true,
        color: COLORS.primary,
        text: 'Good shot - tap to capture',
        icon: 'camera',
        pulse: true
      };
    } else {
      newState = {
        enabled: true,
        color: COLORS.success,
        text: 'Excellent - tap to capture!',
        icon: 'camera',
        pulse: true
      };
    }
    
    setCaptureButtonState(newState);
    
    // Start pulse animation for high-quality detections
    if (newState.pulse) {
      startPulseAnimation();
    }
  };

  /**
   * Set default state when detection fails or is disabled
   */
  const setDefaultState = () => {
    setCaptureButtonState({
      enabled: true,
      color: COLORS.primary,
      text: 'Tap to Capture',
      icon: 'camera',
      pulse: false
    });
    setFeedbackMessage('');
    setQualityTips([]);
    setFeedbackColor(COLORS.textSecondary);
  };

  /**
   * Start pulse animation for the capture button
   */
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  /**
   * Fade in animation for overlay
   */
  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  /**
   * Real-time detection interval - DISABLED
   * Real-time detection is not functional with current Expo Camera setup
   */
  useEffect(() => {
    // Real-time detection disabled - no interval needed
    setDefaultState(); // Ensure button is always enabled
  }, [isVisible]);

  /**
   * Reset state when capture starts
   */
  useEffect(() => {
    if (isCapturing) {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isCapturing]);

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      {/* Detection Frame */}
      <View style={styles.detectionFrame}>
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
        
        {/* Plant Detection Indicator */}
        {detectionResult?.isPlantDetected && (
          <View style={[styles.detectionIndicator, { borderColor: feedbackColor }]}>
            <Ionicons 
              name="leaf" 
              size={20} 
              color={feedbackColor} 
            />
            <Text style={[styles.detectionText, { color: feedbackColor }]}>
              {detectionResult.dominantPlantColor}
            </Text>
          </View>
        )}
      </View>

      {/* Real-time Feedback */}
      {feedbackMessage ? (
        <View style={styles.feedbackContainer}>
          <Text style={[styles.feedbackText, { color: feedbackColor }]}>
            {feedbackMessage}
          </Text>
          
          {/* Quality Tips */}
          {qualityTips.length > 0 && (
            <View style={styles.tipsContainer}>
              {qualityTips.slice(0, 2).map((tip, index) => (
                <Text key={index} style={styles.tipText}>
                  💡 {tip}
                </Text>
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionText}>
            {t('scan.instructions.centerPlant')}
          </Text>
        </View>
      )}

      {/* Smart Capture Button */}
      <View style={styles.captureContainer}>
        <Animated.View
          style={[
            styles.captureButton,
            {
              backgroundColor: captureButtonState.color,
              transform: captureButtonState.pulse ? [{ scale: pulseAnim }] : [],
              opacity: captureButtonState.enabled ? 1 : 0.6,
            }
          ]}
        >
          <TouchableOpacity
            style={styles.captureButtonInner}
            onPress={onCapturePress}
            disabled={!captureButtonState.enabled || isCapturing}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={captureButtonState.icon as any} 
              size={32} 
              color={COLORS.white} 
            />
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.captureButtonText}>
          {captureButtonState.text}
        </Text>
      </View>

      {/* Plant Color Legend */}
      {detectionResult?.isPlantDetected && (
        <View style={styles.colorLegend}>
          <Text style={styles.legendTitle}>
            {t('scan.detectedColors')}
          </Text>
          <View style={styles.colorIndicators}>
            {Object.entries(detectionResult.plantColorProfile).map(([color, confidence]) => {
              if (confidence > 0.3) {
                return (
                  <View key={color} style={styles.colorChip}>
                    <View style={[styles.colorDot, { backgroundColor: getColorHex(color) }]} />
                    <Text style={styles.colorLabel}>{color}</Text>
                  </View>
                );
              }
              return null;
            })}
          </View>
        </View>
      )}
    </Animated.View>
  );
}

/**
 * Get hex color for plant color names
 */
function getColorHex(colorName: string): string {
  const colorMap: Record<string, string> = {
    green: '#4CAF50',
    yellow: '#FFEB3B',
    white: '#FFFFFF',
    purple: '#9C27B0',
    red: '#F44336',
    violet: '#673AB7',
    rose: '#E91E63',
    brown: '#795548'
  };
  return colorMap[colorName] || COLORS.textSecondary;
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    justifyContent: 'space-between',
    paddingVertical: 100,
    paddingHorizontal: 20,
  },
  
  // Detection Frame
  detectionFrame: {
    alignSelf: 'center',
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLORS.primary,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 15,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 15,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 15,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 15,
  },
  
  // Detection Indicator
  detectionIndicator: {
    position: 'absolute',
    top: -40,
    left: '50%',
    transform: [{ translateX: -50 }],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
  },
  detectionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    color: COLORS.white,
    textTransform: 'capitalize',
  },
  
  // Feedback
  feedbackContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginVertical: 20,
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  tipsContainer: {
    marginTop: 8,
  },
  tipText: {
    fontSize: 12,
    color: COLORS.white,
    textAlign: 'center',
    marginVertical: 2,
  },
  
  // Instructions
  instructionsContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginVertical: 20,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 4,
  },
  instructionSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  
  // Capture Button
  captureContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  captureButtonText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  // Color Legend
  colorLegend: {
    position: 'absolute',
    bottom: 200,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 12,
  },
  legendTitle: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  colorIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  colorLabel: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});