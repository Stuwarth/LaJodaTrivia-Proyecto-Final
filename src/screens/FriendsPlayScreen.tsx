import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { Colors, Spacing, Typography, Radius, Shadows } from '../ui/Theme';
import { createRoom, joinRoom } from '../services/rooms';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

export default function FriendsPlayScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const k = useMemo(() => Math.min(Math.max(width / 390, 0.85), 1.15), [width]);
  const s = useMemo(() => makeStyles(k), [k]);

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState<'create' | 'join' | null>(null);

  const handleCreate = async () => {
    if (loading) return;
    try {
      setLoading('create');
      const newCode = await createRoom();
      navigation.navigate('RoomLobby', { code: newCode });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo crear la sala');
    } finally {
      setLoading(null);
    }
  };

  const handleJoin = async () => {
    if (loading) return;
    const cleaned = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (cleaned.length < 4) {
      Alert.alert('Código inválido', 'Ingresa un código válido.');
      return;
    }
    try {
      setLoading('join');
      await joinRoom(cleaned);
      navigation.navigate('RoomLobby', { code: cleaned });
    } catch (e: any) {
      Alert.alert('No se pudo unir', e?.message || 'Verifica el código e inténtalo de nuevo.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={[s.card, Shadows.card]}>
          <Text style={s.title}>Jugar con amigos</Text>
          <Text style={s.subtitle}>Crea una sala o únete con un código</Text>

          <TouchableOpacity style={[s.primaryBtn, loading === 'create' && { opacity: 0.8 }]} onPress={handleCreate} activeOpacity={0.9}>
            <Text style={s.primaryLabel}>{loading === 'create' ? 'Creando…' : 'Crear sala'}</Text>
          </TouchableOpacity>

          <View style={s.joinRow}>
            <TextInput
              style={s.input}
              placeholder="Código"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
              maxLength={8}
              value={code}
              onChangeText={t => setCode(t.toUpperCase())}
            />
            <TouchableOpacity style={[s.joinBtn, loading === 'join' && { opacity: 0.8 }]} onPress={handleJoin} activeOpacity={0.9}>
              <Text style={s.joinLabel}>{loading === 'join' ? 'Uniendo…' : 'Unirse'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.secondaryBtn} onPress={() => Alert.alert('Próximamente', 'Compartir QR para unirse rápidamente')}>
            <Text style={s.secondaryLabel}>Compartir QR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(k: number) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    container: { flex: 1, padding: Spacing.lg * k },
    card: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      padding: Spacing.lg * k,
      borderWidth: 2,
      borderColor: Colors.border,
    },
    title: { ...Typography.title, marginBottom: 4 * k },
    subtitle: { ...Typography.subtitle, marginBottom: Spacing.lg * k },

    primaryBtn: {
      backgroundColor: Colors.primary,
      borderRadius: Radius.lg,
      paddingVertical: 14 * k,
      alignItems: 'center',
      marginBottom: Spacing.md * k,
    },
    primaryLabel: { fontWeight: '900', color: '#1F1300', fontSize: 16 * k },

    joinRow: { flexDirection: 'row', gap: 8 * k, alignItems: 'center' },
    input: {
      flex: 1,
      backgroundColor: Colors.bg,
      borderRadius: Radius.md,
      borderWidth: 2,
      borderColor: Colors.border,
      paddingHorizontal: 12 * k,
      paddingVertical: 10 * k,
      color: Colors.text,
      fontWeight: '700',
      letterSpacing: 1,
    },
    joinBtn: {
      backgroundColor: Colors.secondary,
      borderRadius: Radius.md,
      paddingVertical: 12 * k,
      paddingHorizontal: 16 * k,
    },
    joinLabel: { fontWeight: '900', color: '#fff' },

    secondaryBtn: { alignSelf: 'center', marginTop: Spacing.lg * k },
    secondaryLabel: { ...Typography.label, color: Colors.textMuted },
  });
}
