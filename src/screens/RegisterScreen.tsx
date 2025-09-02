import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { registerWithEmail } from '../auth';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Colors, Spacing, Typography } from '../ui/Theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mapRegisterError(code?: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Este email ya está registrado.';
    case 'auth/invalid-email':
      return 'El email no es válido.';
    case 'auth/weak-password':
      return 'La contraseña es muy débil.';
    case 'auth/network-request-failed':
      return 'Sin conexión. Verifica tu internet.';
    default:
      return 'No se pudo crear la cuenta. Intenta nuevamente.';
  }
}

function passwordIssues(pwd: string): string[] {
  const issues: string[] = [];
  if (pwd.length < 8) issues.push('Mínimo 8 caracteres');
  if (!/[A-Z]/.test(pwd)) issues.push('Al menos 1 mayúscula');
  if (!/[0-9]/.test(pwd)) issues.push('Al menos 1 número');
  return issues;
}

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const emailError = useMemo(() => {
    if (!email) return 'Ingrese su email';
    if (!emailRegex.test(email)) return 'Formato de email inválido';
    return '';
  }, [email]);

  const pwdIssues = useMemo(() => passwordIssues(password), [password]);
  const passwordError = pwdIssues.length ? pwdIssues.join(' · ') : '';
  const confirmError = useMemo(() => {
    if (!confirm) return 'Repita la contraseña';
    if (confirm !== password) return 'Las contraseñas no coinciden';
    return '';
  }, [confirm, password]);

  const isValid = !emailError && !passwordError && !confirmError;

  const onRegister = async () => {
    setFormError(null);
    if (!isValid) {
      setFormError('Revisa los campos resaltados');
      return;
    }
    try {
      setLoading(true);
  await registerWithEmail(email.trim(), password);
  navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (e: any) {
      setFormError(mapRegisterError(e?.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <Text style={styles.title}>Crea tu cuenta</Text>
            <Text style={styles.subtitle}>Vincula tu progreso y juega con amigos</Text>

            <View style={{ height: Spacing.lg }} />
            <Input
              label="Email"
              placeholder="tu@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              error={email ? emailError : ''}
            />
            <View style={{ height: Spacing.md }} />
            <Input
              label="Contraseña"
              placeholder="••••••••"
              secureTextEntry
              secureToggle
              value={password}
              onChangeText={setPassword}
              error={password ? passwordError : ''}
            />
            <View style={{ height: Spacing.md }} />
            <Input
              label="Confirmar contraseña"
              placeholder="••••••••"
              secureTextEntry
              secureToggle
              value={confirm}
              onChangeText={setConfirm}
              error={confirm ? confirmError : ''}
            />

            {!!formError && (
              <Text style={styles.formError}>{formError}</Text>
            )}

            <View style={{ height: Spacing.lg }} />
            <Button title={loading ? 'Creando…' : 'Crear cuenta'} onPress={onRegister} loading={loading} disabled={!isValid || loading} />

            <View style={{ height: Spacing.md }} />
            <Button title="¿Ya tienes cuenta? Inicia sesión" variant="ghost" onPress={() => navigation.navigate('Login')} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, flexGrow: 1, justifyContent: 'center' },
  content: { width: '100%', maxWidth: 420, alignSelf: 'center' },
  title: { ...Typography.title, textAlign: 'center' },
  subtitle: { ...Typography.subtitle, textAlign: 'center', marginTop: 6 },
  formError: { color: Colors.danger, marginTop: Spacing.md, textAlign: 'center' },
});
