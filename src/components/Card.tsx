import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { COLORS } from '@/constants/colors';
import { BORDER_RADIUS, SPACING } from '@/constants/spacing';

type Props = ViewProps;

const Card: React.FC<Props> = ({ style, ...props }) => {
  return <View style={[styles.base, style]} {...props} />;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.m,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default Card;
