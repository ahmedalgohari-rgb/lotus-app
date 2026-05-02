import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FIBONACCI, TYPOGRAPHY } from '../constants';

interface TraitPillProps {
  label: string;
  danger?: boolean;
  icon?: React.ReactNode;
  onPress?: () => void;
}

export default function TraitPill({ label, danger = false, icon, onPress }: TraitPillProps) {
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container
      style={[styles.pill, danger && styles.pillDanger]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon}
      <Text style={[styles.label, danger && styles.labelDanger]}>{label}</Text>
    </Container>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    paddingHorizontal: FIBONACCI.MD,
    paddingVertical: FIBONACCI.XS,
    flexDirection: 'row',
    alignItems: 'center',
    gap: FIBONACCI.XXS,
  },
  pillDanger: {
    backgroundColor: '#FDDEDE',
  },
  label: {
    fontSize: TYPOGRAPHY.XS,
    fontWeight: '500',
    color: COLORS.text,
  },
  labelDanger: {
    color: '#E53E3E',
  },
});
