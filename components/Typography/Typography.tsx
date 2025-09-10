import React, { FC, ReactNode } from 'react';
import {
  Text,
  StyleSheet,
  TextStyle,
  TextProps,
} from 'react-native';
import { Colors, Typography as TypographyStyles, TypographyKey } from '@/constants';

interface TypographyProps extends Omit<TextProps, 'style'> {
  variant?: TypographyKey;
  color?: keyof typeof Colors;
  children: ReactNode;
  style?: TextStyle;
  arabic?: boolean;
  testID?: string;
}

export const Typography: FC<TypographyProps> = ({
  variant = 'body',
  color = 'textPrimary',
  children,
  style,
  arabic = false,
  testID,
  ...props
}) => {
  const getTextStyle = (): TextStyle => {
    const baseStyle = TypographyStyles[variant];
    const colorValue = Colors[color] || Colors.textPrimary;
    
    return {
      ...baseStyle,
      color: colorValue,
      ...(arabic && {
        textAlign: 'right',
        writingDirection: 'rtl',
      }),
    };
  };

  return (
    <Text
      style={[getTextStyle(), style]}
      testID={testID}
      {...props}
    >
      {children}
    </Text>
  );
};

// Specialized text components for common use cases
export const AppTitle: FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="appTitle" {...props} />
);

export const ScreenTitle: FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="screenTitle" {...props} />
);

export const SectionHeader: FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="sectionHeader" {...props} />
);

export const BodyText: FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="body" {...props} />
);

export const Caption: FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="caption" {...props} />
);

export const PlantName: FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="plantName" {...props} />
);

export const ScientificName: FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="scientificName" {...props} />
);

export const CareTip: FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="careTip" color="nileBlue" {...props} />
);

export default Typography;