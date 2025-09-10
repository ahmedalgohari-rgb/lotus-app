/**
 * Enhanced Visual Components
 * Professional components with proper visual hierarchy
 */
import React from 'react';
import { View, ViewProps, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants';
import { 
  EnhancedShadows, 
  CardPatterns, 
  EmphasisLevels,
  VisualSpacing,
  ComponentHierarchy,
  MotionConfig,
  IconSizes,
  VisualHierarchyUtils
} from '@/constants/visualHierarchy';
import Text from '@/components/Text';

// Enhanced Card Component with visual hierarchy
interface EnhancedCardProps extends ViewProps {
  variant?: keyof typeof CardPatterns;
  emphasis?: keyof typeof EmphasisLevels;
  children: React.ReactNode;
  elevated?: boolean;
  interactive?: boolean;
  onPress?: () => void;
}

export const EnhancedCard: React.FC<EnhancedCardProps> = ({
  variant = 'content',
  emphasis = 'secondary',
  children,
  elevated = false,
  interactive = false,
  onPress,
  style,
  ...props
}) => {
  const [pressed, setPressed] = React.useState(false);
  const animatedValue = React.useRef(new Animated.Value(1)).current;

  const cardStyle = VisualHierarchyUtils.getCardPattern(variant);
  const emphasisStyle = VisualHierarchyUtils.getEmphasis(emphasis);
  
  // Enhanced shadow when elevated
  const shadowStyle = elevated ? EnhancedShadows.strong : cardStyle;

  const handlePressIn = () => {
    if (interactive && onPress) {
      setPressed(true);
      Animated.spring(animatedValue, {
        toValue: 0.98,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (interactive && onPress) {
      setPressed(false);
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
      onPress();
    }
  };

  return (
    <Animated.View
      style={[
        cardStyle,
        shadowStyle,
        pressed && { opacity: 0.9 },
        { transform: [{ scale: animatedValue }] },
        style,
      ]}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
      onTouchCancel={handlePressOut}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

// Visual Section with proper hierarchy
interface VisualSectionProps extends ViewProps {
  title?: string;
  subtitle?: string;
  titleLevel?: 1 | 2 | 3 | 4;
  spacing?: keyof typeof VisualSpacing;
  children: React.ReactNode;
  showDivider?: boolean;
}

export const VisualSection: React.FC<VisualSectionProps> = ({
  title,
  subtitle,
  titleLevel = 2,
  spacing = 'large',
  children,
  showDivider = false,
  style,
  ...props
}) => {
  const spacingValue = VisualHierarchyUtils.getSpacing(spacing);
  
  return (
    <View style={[{ marginBottom: spacingValue }, style]} {...props}>
      {title && (
        <View style={styles.sectionHeader}>
          <Text 
            style={[
              ComponentHierarchy.sectionHeader,
              titleLevel === 1 && ComponentHierarchy.hero,
              titleLevel === 3 && ComponentHierarchy.contentBlock,
              titleLevel === 4 && ComponentHierarchy.supportingText,
            ]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text style={ComponentHierarchy.supportingText}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
      
      {showDivider && <View style={styles.divider} />}
      
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
};

// Enhanced Status Indicator with visual hierarchy
interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: keyof typeof IconSizes;
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'medium',
  showLabel = false,
  label,
  animated = true,
}) => {
  const statusColors = {
    success: '#10B981',
    warning: '#F59E0B', 
    error: '#EF4444',
    info: Colors.nileBlue,
    neutral: Colors.textSecondary,
  };

  const statusShadows = {
    success: EnhancedShadows.success,
    warning: EnhancedShadows.warning,
    error: EnhancedShadows.error,
    info: EnhancedShadows.medium,
    neutral: EnhancedShadows.subtle,
  };

  const iconSize = IconSizes[size];
  const color = statusColors[status];
  const shadow = statusShadows[status];

  const animatedScale = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (animated) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedScale, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(animatedScale, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animated]);

  return (
    <View style={styles.statusContainer}>
      <Animated.View
        style={[
          styles.statusIndicator,
          shadow,
          {
            width: iconSize,
            height: iconSize,
            backgroundColor: color,
            transform: animated ? [{ scale: animatedScale }] : [{ scale: 1 }],
          },
        ]}
      />
      {showLabel && label && (
        <Text style={[ComponentHierarchy.caption, { color, marginLeft: 8 }]}>
          {label}
        </Text>
      )}
    </View>
  );
};

// Enhanced Progress Indicator
interface ProgressIndicatorProps {
  progress: number; // 0-1
  size?: 'small' | 'medium' | 'large';
  showPercentage?: boolean;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  size = 'medium',
  showPercentage = false,
  color = Colors.lotusGreen,
  backgroundColor = Colors.border,
  animated = true,
}) => {
  const heights = { small: 4, medium: 6, large: 8 };
  const height = heights[size];
  
  const animatedWidth = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: progress,
        duration: MotionConfig.smooth.duration,
        useNativeDriver: false,
      }).start();
    }
  }, [progress, animated]);

  return (
    <View style={styles.progressContainer}>
      <View 
        style={[
          styles.progressTrack,
          { height, backgroundColor },
          EnhancedShadows.subtle,
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              height,
              backgroundColor: color,
              width: animated 
                ? animatedWidth.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  })
                : `${progress * 100}%`,
            },
          ]}
        />
      </View>
      
      {showPercentage && (
        <Text style={[ComponentHierarchy.caption, styles.progressText]}>
          {Math.round(progress * 100)}%
        </Text>
      )}
    </View>
  );
};

// Enhanced Gradient Background
interface GradientBackgroundProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'subtle';
  children: React.ReactNode;
  style?: any;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  variant = 'primary',
  children,
  style,
}) => {
  const gradients = {
    primary: Colors.primaryGradient,
    secondary: [Colors.nileBlue, Colors.lotusGreen],
    success: ['#10B981', '#059669'],
    warning: ['#F59E0B', '#D97706'],
    subtle: [Colors.background, Colors.backgroundSecondary],
  };

  return (
    <LinearGradient
      colors={gradients[variant]}
      style={[{ flex: 1 }, style]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {children}
    </LinearGradient>
  );
};

// Enhanced Divider Component
interface VisualDividerProps {
  variant?: 'subtle' | 'medium' | 'strong';
  orientation?: 'horizontal' | 'vertical';
  spacing?: keyof typeof VisualSpacing;
  length?: number | string;
}

export const VisualDivider: React.FC<VisualDividerProps> = ({
  variant = 'subtle',
  orientation = 'horizontal',
  spacing = 'medium',
  length = '100%',
}) => {
  const spacingValue = VisualHierarchyUtils.getSpacing(spacing);
  
  const opacities = {
    subtle: 0.1,
    medium: 0.2,
    strong: 0.4,
  };

  const dividerStyle = {
    backgroundColor: Colors.textPrimary,
    opacity: opacities[variant],
    ...(orientation === 'horizontal'
      ? {
          height: 1,
          width: length,
          marginVertical: spacingValue,
        }
      : {
          width: 1,
          height: length,
          marginHorizontal: spacingValue,
        }),
  };

  return <View style={dividerStyle} />;
};

const styles = StyleSheet.create({
  sectionHeader: {
    marginBottom: VisualSpacing.medium,
  },
  sectionContent: {
    // Content styling handled by children
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: VisualSpacing.medium,
    opacity: 0.3,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    borderRadius: 50,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 10,
  },
  progressText: {
    minWidth: 35,
    textAlign: 'right',
  },
});

export default {
  EnhancedCard,
  VisualSection,
  StatusIndicator,
  ProgressIndicator,
  GradientBackground,
  VisualDivider,
};