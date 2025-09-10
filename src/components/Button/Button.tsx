import React, { FC, ReactNode } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Layout, Shadow } from '@/constants';
import { getResponsiveLayout } from '@/utils/responsive';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'oauth-apple' | 'oauth-google';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export const Button: FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  testID,
}) => {
  const responsiveLayout = getResponsiveLayout();
  
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      height: size === 'small' ? 40 : size === 'medium' ? 48 : responsiveLayout.buttonHeight,
      borderRadius: variant === 'primary' ? responsiveLayout.buttonHeight / 2 : Layout.cardRadiusSmall,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    };

    switch (variant) {
      case 'secondary':
        return {
          ...baseStyle,
          borderWidth: 2,
          borderColor: Colors.lotusGreen,
          backgroundColor: 'transparent',
        };
      case 'oauth-apple':
        return {
          ...baseStyle,
          backgroundColor: Colors.textPrimary,
          marginBottom: Layout.cardPadding,
        };
      case 'oauth-google':
        return {
          ...baseStyle,
          backgroundColor: Colors.pureWhite,
          borderWidth: 1,
          borderColor: Colors.border,
          marginBottom: Layout.cardPadding,
        };
      default: // primary
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: size === 'small' ? 14 : 16,
      fontWeight: variant === 'primary' ? Typography.buttonPrimary.fontWeight : Typography.buttonSecondary.fontWeight,
    };

    switch (variant) {
      case 'secondary':
        return {
          ...baseStyle,
          color: disabled ? Colors.mediumGray : Colors.lotusGreen,
        };
      case 'oauth-apple':
        return {
          ...baseStyle,
          color: Colors.pureWhite,
        };
      case 'oauth-google':
        return {
          ...baseStyle,
          color: Colors.textPrimary,
        };
      default: // primary
        return {
          ...baseStyle,
          color: Colors.pureWhite,
        };
    }
  };

  const buttonStyle = getButtonStyle();
  const buttonTextStyle = getTextStyle();

  const renderButton = (): ReactNode => (
    <TouchableOpacity
      style={[
        buttonStyle,
        disabled && styles.disabled,
        variant === 'primary' && !disabled && Shadow.md,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      testID={testID}
    >
      <View style={styles.buttonContent}>
        {icon && !loading && <View style={styles.iconContainer}>{icon}</View>}
        
        {loading ? (
          <ActivityIndicator 
            color={variant === 'primary' ? Colors.pureWhite : Colors.lotusGreen}
            size="small"
          />
        ) : (
          <Text style={[buttonTextStyle, textStyle]}>{title}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  // Render primary button with gradient
  if (variant === 'primary' && !disabled) {
    return (
      <LinearGradient
        colors={Colors.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          buttonStyle,
          Shadow.md,
          style,
        ]}
      >
        <TouchableOpacity
          style={styles.gradientButton}
          onPress={onPress}
          disabled={disabled || loading}
          activeOpacity={0.8}
          testID={testID}
        >
          <View style={styles.buttonContent}>
            {icon && !loading && <View style={styles.iconContainer}>{icon}</View>}
            
            {loading ? (
              <ActivityIndicator color={Colors.pureWhite} size="small" />
            ) : (
              <Text style={[buttonTextStyle, textStyle]}>{title}</Text>
            )}
          </View>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return renderButton();
};

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: Layout.sm,
  },
});

export default Button;