import React, { FC, useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { Colors, Typography, Layout, Spacing } from '@/constants';
import { getResponsiveLayout } from '@/utils/responsive';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  labelArabic?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  required?: boolean;
  testID?: string;
}

export const Input: FC<InputProps> = ({
  label,
  labelArabic,
  error,
  containerStyle,
  inputStyle,
  labelStyle,
  required = false,
  testID,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const responsiveLayout = getResponsiveLayout();

  const handleFocus = (event: any): void => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: any): void => {
    setIsFocused(false);
    onBlur?.(event);
  };

  const getInputContainerStyle = (): ViewStyle => ({
    height: responsiveLayout.inputHeight,
    borderWidth: 1,
    borderRadius: Layout.inputRadius,
    borderColor: error 
      ? Colors.error 
      : isFocused 
        ? Colors.borderFocus 
        : Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  });

  const getInputTextStyle = (): TextStyle => ({
    ...Typography.body,
    color: Colors.textPrimary,
    textAlign: props.textAlign || 'left',
  });

  const getLabelStyle = (): TextStyle => ({
    ...Typography.bodySecondary,
    fontWeight: Typography.sectionHeader.fontWeight,
    color: Colors.lotusGreen,
    marginBottom: Spacing.xs,
  });

  const getErrorStyle = (): TextStyle => ({
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
  });

  return (
    <View style={[styles.container, containerStyle]} testID={testID}>
      {(label || labelArabic) && (
        <View style={styles.labelContainer}>
          {label && (
            <Text style={[getLabelStyle(), labelStyle]}>
              {label}
              {required && <Text style={styles.required}> *</Text>}
            </Text>
          )}
          {labelArabic && (
            <Text style={[getLabelStyle(), styles.arabicLabel, labelStyle]}>
              {labelArabic}
              {required && <Text style={styles.required}> *</Text>}
            </Text>
          )}
        </View>
      )}
      
      <View style={[getInputContainerStyle(), error && styles.errorContainer]}>
        <TextInput
          style={[getInputTextStyle(), inputStyle]}
          placeholderTextColor={Colors.textSecondary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </View>
      
      {error && (
        <Text style={getErrorStyle()}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.sectionSpacing,
  },
  labelContainer: {
    flexDirection: 'column',
  },
  arabicLabel: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  required: {
    color: Colors.error,
  },
  errorContainer: {
    borderColor: Colors.error,
  },
});

export default Input;