import React from 'react';
import { ActivityIndicator, GestureResponderEvent, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing, Typography } from './Theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  title: string;
  onPress?: (e: GestureResponderEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  variant?: ButtonVariant;
};

export default function Button({ title, onPress, disabled, loading, style, variant = 'primary' }: Props) {
  const bg =
    variant === 'primary' ? Colors.primary :
    variant === 'secondary' ? Colors.secondary :
    variant === 'danger' ? Colors.danger : 'transparent';

  const textColor = variant === 'ghost' ? Colors.text : '#fff';
  const borderColor = variant === 'ghost' ? Colors.border : 'transparent';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        { backgroundColor: bg, borderColor },
        (disabled || loading) && { opacity: 0.6 },
        variant === 'ghost' && { backgroundColor: 'transparent' },
        style,
      ]}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...Typography.subtitle,
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
