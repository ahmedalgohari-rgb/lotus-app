/**
 * Contextual Help Component
 * Beautiful, non-intrusive help tips and guided tours
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Layout } from '@/constants';
import Text from '@/components/Text';
import Button from '@/components/Button';
import { contextualHelpService, HelpTip } from '@/services/contextualHelp';
import { useRTL } from '@/hooks/useRTL';

const { width, height } = Dimensions.get('window');

interface ContextualHelpProps {
  screen: string;
  context: {
    isFirstTime?: boolean;
    userType?: 'beginner' | 'intermediate' | 'expert';
    errorState?: boolean;
    feature?: string;
    element?: string;
  };
  onTipAction?: (tipId: string, action: string) => void;
}

interface HelpTooltipProps {
  tip: HelpTip;
  onAction: (action: string) => void;
  onClose: () => void;
  position?: { x: number; y: number };
  language: 'en' | 'ar';
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({
  tip,
  onAction,
  onClose,
  position,
  language
}) => {
  const { isRTL } = useRTL();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const title = language === 'ar' ? tip.titleAr : tip.titleEn;
  const content = language === 'ar' ? tip.contentAr : tip.contentEn;

  const getTypeIcon = () => {
    switch (tip.type) {
      case 'tooltip': return 'info';
      case 'walkthrough': return 'explore';
      case 'hint': return 'lightbulb';
      case 'warning': return 'warning';
      default: return 'help';
    }
  };

  const getTypeColor = () => {
    switch (tip.type) {
      case 'tooltip': return Colors.lotusGreen;
      case 'walkthrough': return Colors.nileBlue;
      case 'hint': return '#FFC107';
      case 'warning': return '#FF5722';
      default: return Colors.lotusGreen;
    }
  };

  return (
    <Modal
      visible={true}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <BlurView intensity={20} style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayTouch} 
          onPress={handleClose}
          activeOpacity={1}
        >
          <Animated.View
            style={[
              styles.tooltipContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
                ...(position && {
                  position: 'absolute',
                  top: Math.min(position.y + 60, height - 300),
                  left: Math.max(Math.min(position.x - 150, width - 320), 20),
                }),
              },
            ]}
          >
            {/* Header with icon and close */}
            <View style={[styles.tooltipHeader, isRTL && styles.tooltipHeaderRTL]}>
              <View style={[styles.headerLeft, isRTL && styles.headerLeftRTL]}>
                <MaterialIcons 
                  name={getTypeIcon()} 
                  size={24} 
                  color={getTypeColor()} 
                />
                <Text style={[styles.tooltipTitle, isRTL && styles.tooltipTitleRTL]}>
                  {title}
                </Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.tooltipContent}>
              <Text style={[styles.tooltipText, isRTL && styles.tooltipTextRTL]}>
                {content}
              </Text>
            </View>

            {/* Actions */}
            {tip.actions && tip.actions.length > 0 && (
              <View style={[styles.tooltipActions, isRTL && styles.tooltipActionsRTL]}>
                {tip.actions.map((action, index) => {
                  const label = language === 'ar' ? action.labelAr : action.labelEn;
                  const isPrimary = action.action === 'tryNow' || action.action === 'showMore';
                  
                  return (
                    <Button
                      key={index}
                      title={label}
                      variant={isPrimary ? 'primary' : 'secondary'}
                      onPress={() => onAction(action.action)}
                      style={[
                        styles.actionButton,
                        !isPrimary && styles.secondaryActionButton
                      ]}
                    />
                  );
                })}
              </View>
            )}
          </Animated.View>
        </TouchableOpacity>
      </BlurView>
    </Modal>
  );
};

const ContextualHelp: React.FC<ContextualHelpProps> = ({
  screen,
  context,
  onTipAction
}) => {
  const [currentTip, setCurrentTip] = useState<HelpTip | null>(null);
  const [language, setLanguage] = useState<'en' | 'ar'>('en');

  useEffect(() => {
    loadRelevantTips();
  }, [screen, context]);

  const loadRelevantTips = async () => {
    try {
      const tips = await contextualHelpService.getRelevantTips(screen, context);
      if (tips.length > 0) {
        setCurrentTip(tips[0]); // Show the highest priority tip
        await contextualHelpService.markTipShown(tips[0].id);
      }
    } catch (error) {
      console.error('Error loading contextual tips:', error);
    }
  };

  const handleTipAction = async (action: string) => {
    if (!currentTip) return;

    switch (action) {
      case 'dismiss':
        await contextualHelpService.dismissTip(currentTip.id, false);
        setCurrentTip(null);
        break;
      
      case 'gotIt':
        await contextualHelpService.dismissTip(currentTip.id, true);
        setCurrentTip(null);
        break;
      
      case 'showMore':
      case 'tryNow':
        onTipAction?.(currentTip.id, action);
        setCurrentTip(null);
        break;
      
      default:
        setCurrentTip(null);
        break;
    }
  };

  const handleClose = () => {
    setCurrentTip(null);
  };

  if (!currentTip) {
    return null;
  }

  return (
    <HelpTooltip
      tip={currentTip}
      onAction={handleTipAction}
      onClose={handleClose}
      language={language}
    />
  );
};

// Hook for using contextual help in screens
export const useContextualHelp = (screen: string) => {
  const [helpContext, setHelpContext] = useState<{
    isFirstTime?: boolean;
    userType?: 'beginner' | 'intermediate' | 'expert';
    errorState?: boolean;
    feature?: string;
    element?: string;
  }>({});

  const showHelp = (context: typeof helpContext) => {
    setHelpContext({ ...helpContext, ...context });
  };

  const showHelpForElement = (element: string, additionalContext?: Partial<typeof helpContext>) => {
    setHelpContext({ ...helpContext, element, ...additionalContext });
  };

  const showErrorHelp = (feature: string, additionalContext?: Partial<typeof helpContext>) => {
    setHelpContext({ ...helpContext, errorState: true, feature, ...additionalContext });
  };

  return {
    helpContext,
    showHelp,
    showHelpForElement,
    showErrorHelp,
    ContextualHelpComponent: (props: Omit<ContextualHelpProps, 'screen' | 'context'>) => (
      <ContextualHelp screen={screen} context={helpContext} {...props} />
    )
  };
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouch: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  tooltipContainer: {
    backgroundColor: Colors.pureWhite,
    borderRadius: Layout.borderRadius.large,
    maxWidth: width * 0.85,
    minWidth: 280,
    marginHorizontal: Layout.screenPadding,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.lg,
    paddingTop: Layout.lg,
    paddingBottom: Layout.sm,
  },
  tooltipHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Layout.sm,
  },
  headerLeftRTL: {
    flexDirection: 'row-reverse',
  },
  tooltipTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    flex: 1,
  },
  tooltipTitleRTL: {
    textAlign: 'right',
  },
  closeButton: {
    padding: Layout.xs,
    marginLeft: Layout.sm,
  },
  tooltipContent: {
    paddingHorizontal: Layout.lg,
    paddingBottom: Layout.md,
  },
  tooltipText: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  tooltipTextRTL: {
    textAlign: 'right',
  },
  tooltipActions: {
    flexDirection: 'row',
    gap: Layout.sm,
    paddingHorizontal: Layout.lg,
    paddingBottom: Layout.lg,
    justifyContent: 'flex-end',
  },
  tooltipActionsRTL: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
  },
  actionButton: {
    minWidth: 80,
    paddingHorizontal: Layout.md,
  },
  secondaryActionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

export default ContextualHelp;
export { HelpTooltip, useContextualHelp };