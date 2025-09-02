import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { Colors, Radius, Spacing, Typography } from './Theme';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  secureToggle?: boolean;
};

export default function Input({ label, error, secureTextEntry, secureToggle, style, ...rest }: Props) {
  const [hidden, setHidden] = useState<boolean>(!!secureTextEntry);
  return (
    <View style={styles.wrap}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.fieldWrap, !!error && { borderColor: Colors.danger }]}>        
        <TextInput
          placeholderTextColor={Colors.textMuted}
          style={[styles.input, style]}
          secureTextEntry={hidden}
          {...rest}
        />
        {secureToggle ? (
          <TouchableOpacity onPress={() => setHidden(v => !v)}>
            <Text style={styles.toggle}>{hidden ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  label: { ...Typography.label, marginBottom: 6 },
  fieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    color: Colors.text,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  toggle: { color: Colors.textMuted, marginLeft: 8, fontSize: 18 },
  error: { color: Colors.danger, marginTop: 6 },
});
