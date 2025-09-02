import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Colors, Spacing, Typography, Radius, Shadows } from '../ui/Theme';
import { cancelMatchmaking, findMatch } from '../services/matchmaking';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

export default function MatchmakingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [searching, setSearching] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { code } = await findMatch();
        if (!mounted) return;
        navigation.replace('RoomLobby', { code });
      } catch (e: any) {
        if (!mounted) return;
        Alert.alert('Emparejamiento', e?.message || 'No se encontró rival.');
        navigation.goBack();
      }
    })();
    return () => {
      mounted = false;
      cancelMatchmaking();
    };
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.card, Shadows.card]}>
        <Text style={styles.title}>Buscando rival…</Text>
        <ActivityIndicator color={Colors.secondary} size="large" />
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelLabel}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.lg, width: '100%', alignItems: 'center', gap: Spacing.md },
  title: { ...Typography.title },
  cancelBtn: { marginTop: Spacing.md, backgroundColor: Colors.danger, borderRadius: Radius.md, paddingVertical: 10, paddingHorizontal: 16 },
  cancelLabel: { color: '#1F1300', fontWeight: '900' },
});
