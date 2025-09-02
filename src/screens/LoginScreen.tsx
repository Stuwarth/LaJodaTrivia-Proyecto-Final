import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { signInWithEmail } from '../auth';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Colors, Spacing, Typography } from '../ui/Theme';
import auth from '@react-native-firebase/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mapAuthError(code?: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'El email no es válido.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Credenciales incorrectas.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Intenta más tarde.';
    case 'auth/network-request-failed':
      return 'Sin conexión. Verifica tu internet.';
    default:
      return 'No se pudo iniciar sesión. Intenta nuevamente.';
  }
}

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const emailError = useMemo(() => {
    if (!email) return 'Ingrese su email';
    if (!emailRegex.test(email)) return 'Formato de email inválido';
    return '';
  }, [email]);

  const passwordError = useMemo(() => {
    if (!password) return 'Ingrese su contraseña';
    return '';
  }, [password]);

  const isValid = !emailError && !passwordError;

  const onLogin = async () => {
    setFormError(null);
    if (!isValid) {
      setFormError('Revisa los campos resaltados');
      return;
    }
    try {
      setLoading(true);
  await signInWithEmail(email.trim(), password);
  navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (e: any) {
      setFormError(mapAuthError(e?.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <Text style={styles.title}>Bienvenido de vuelta</Text>
            <Text style={styles.subtitle}>Ingresa para continuar jugando</Text>

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

            {!!formError && (
              <Text style={styles.formError}>{formError}</Text>
            )}

            <View style={{ height: Spacing.lg }} />
            <Button title={loading ? 'Entrando…' : 'Entrar'} onPress={onLogin} loading={loading} disabled={!isValid || loading} />

            <View style={{ height: Spacing.md }} />
            <Button title="Crear cuenta" variant="ghost" onPress={() => navigation.navigate('Register')} />

            <View style={{ height: Spacing.md }} />
            <Button
              title="Entrar como invitado"
              variant="ghost"
              onPress={async () => {
                try {
                  await auth().signInAnonymously();
                  navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
                } catch (e) {
                  setFormError('No se pudo entrar como invitado. Intenta de nuevo.');
                }
              }}
            />
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
