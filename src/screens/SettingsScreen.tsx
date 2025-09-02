import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, Alert, ActivityIndicator, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors, Spacing, Typography, Radius, Shadows } from '../ui/Theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import database from '@react-native-firebase/database';
import UIButton from '../ui/Button';
import TextInput from '../ui/Input';
import { launchImageLibrary } from 'react-native-image-picker';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const user = auth().currentUser;
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState<string | undefined>(user?.photoURL || undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName || '');
    setPhotoURL(user.photoURL || undefined);
  }, [user?.uid]);

  async function ensureMediaPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    const perm = Platform.Version >= 33 ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
    const res = await check(perm);
    if (res === RESULTS.GRANTED) return true;
    const req = await request(perm);
    return req === RESULTS.GRANTED;
  }

  async function onPickAvatar() {
    const ok = await ensureMediaPermission();
    if (!ok) {
      Alert.alert('Permiso requerido', 'Otorga acceso a tus fotos para elegir un avatar.');
      return;
    }
    const res = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 1 });
    const asset = res.assets?.[0];
    if (!asset?.uri) return;
    try {
      setLoading(true);
      const path = `avatars/${user?.uid}.jpg`;
      await storage().ref(path).putFile(asset.uri);
      const url = await storage().ref(path).getDownloadURL();
      await user?.updateProfile({ photoURL: url });
      await database().ref(`users/${user?.uid}/profile`).update({ photoURL: url });
      setPhotoURL(url);
      Alert.alert('Listo', 'Avatar actualizado');
    } catch (e: any) {
      Alert.alert('Error', 'No se pudo subir la imagen.');
    } finally {
      setLoading(false);
    }
  }

  async function onSaveProfile() {
    if (!user) return;
    try {
      setLoading(true);
      if (displayName && displayName !== user.displayName) {
        await user.updateProfile({ displayName });
        await database().ref(`users/${user.uid}/profile`).update({ displayName });
      }
      Alert.alert('Guardado', 'Perfil actualizado');
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setLoading(false);
    }
  }

  async function onLogout() {
    try {
      await auth().signOut();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch {
      Alert.alert('Error', 'No se pudo cerrar sesión');
    }
  }

  const s = useMemo(() => styles, []);

  return (
    <SafeAreaView style={s.safe}>
      <View style={[s.card, Shadows.card]}>
        <View style={s.headerRow}>
          <Text style={s.title}>Ajustes</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button">
            <Icon name="close-circle" size={28} color={Colors.danger} />
          </TouchableOpacity>
        </View>

        <View style={s.profileRow}>
          <TouchableOpacity onPress={onPickAvatar} accessibilityRole="button">
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={s.avatar} />
            ) : (
              <View style={[s.avatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.secondary }]}>
                <Icon name="camera" size={24} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Nombre de usuario</Text>
            <TextInput value={displayName} onChangeText={setDisplayName} placeholder="Tu nombre" />
          </View>
        </View>

        <View style={{ height: Spacing.md }} />
        <UIButton title={loading ? 'Guardando…' : 'Guardar cambios'} onPress={onSaveProfile} disabled={loading} />

        <View style={{ height: Spacing.lg }} />
        <UIButton title="Cerrar sesión" onPress={onLogout} />
        {loading && (
          <View style={{ marginTop: Spacing.md }}>
            <ActivityIndicator color={Colors.secondary} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 2, borderColor: Colors.border, padding: Spacing.lg, gap: Spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...Typography.title },
  profileRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: Colors.border },
  label: { ...Typography.label, marginBottom: 6 },
});
