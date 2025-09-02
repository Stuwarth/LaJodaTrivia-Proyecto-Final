import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
import { Colors, Spacing, Typography, Radius, Shadows } from '../ui/Theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { listenRoom, RoomState, leaveRoom } from '../services/rooms';
import { nextRound, finishGame } from '../services/game';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

 type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

export default function ResultsScreen({ route }: Props) {
  const { code } = route.params;
  const uid = auth().currentUser?.uid;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [room, setRoom] = useState<RoomState | null>(null);
  const { width } = useWindowDimensions();
  const k = useMemo(() => Math.min(Math.max(width / 392, 0.85), 1.15), [width]);
  const s = useMemo(() => makeStyles(k), [k]);

  useEffect(() => {
    const off = listenRoom(code, setRoom);
    return off;
  }, [code]);

  // When host taps "Finalizar partida" stage becomes 'finished'.
  // Navigate players back to Home/Game when that happens.
  useEffect(() => {
    if (!room) return;
    if ((room as any).stage === 'finished') {
      // Leave room to help delete it when empty, then go Home
      leaveRoom(code).finally(() => {
        // @ts-ignore
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      });
    }
  }, [room, navigation, code]);

  const round = (room as any)?.currentRound || 1;
  const question = (room as any)?.rounds?.[round]?.question;
  const answers = (room as any)?.rounds?.[round]?.answers || {};
  const players = Object.entries((room as any)?.players || {}).map(([pid, p]: any) => ({ uid: pid, alias: p.alias }));
  const scores = (room as any)?.scores || {};
  const total = (room as any)?.questionsTotal || 1;
  const isHost = uid && room?.host === uid;

  if (!room) {
    return (
      <SafeAreaView style={s.safe}> 
        <ActivityIndicator color={Colors.secondary} />
      </SafeAreaView>
    );
  }

  const correctIndex = question?.options?.findIndex((o: any) => o.correct) ?? -1;

  const data = players.map((p) => {
    const a = answers[p.uid]?.optionIndex;
    const ok = a === correctIndex;
    return { ...p, answerIndex: a, ok };
  });

  return (
    <SafeAreaView style={s.safe}> 
      <ScrollView contentContainerStyle={{ paddingBottom: Spacing.lg * k }} keyboardShouldPersistTaps="handled">
      <View style={[s.card, Shadows.card]}>
        <Text style={s.title}>Resultados</Text>
        {question && <Text style={s.subtitle}>{question.prompt}</Text>}
        <View>
          {data.map((item) => (
            <View key={item.uid} style={[s.row, { marginTop: 8 * k }]}>
              <Text style={[s.player, { fontSize: 14 * k }]}>{item.alias || 'Invitado'}</Text>
              <Text style={[s.badge, item.ok ? s.ok : s.wrong]}>{item.ok ? '✔' : '✘'}</Text>
            </View>
          ))}
        </View>
        <View style={{ marginTop: Spacing.md }}>
          <Text style={s.subtitle}>Marcador</Text>
          {players.map((p) => (
            <View key={p.uid} style={s.row}>
              <Text style={[s.player, { fontSize: 14 * k }]}>{p.alias || 'Invitado'}</Text>
              <Text style={[s.score, { fontSize: 14 * k }]}>{scores[p.uid] || 0}</Text>
            </View>
          ))}
        </View>
        {isHost ? (
          round < total ? (
            <TouchableOpacity style={[s.primaryBtn, Shadows.card]} onPress={() => nextRound(code, (question as any)?.category as string)}>
              <Text style={s.primaryLabel}>Siguiente ronda ({round + 1}/{total})</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[s.primaryBtn, Shadows.card]} onPress={() => finishGame(code)}>
              <Text style={s.primaryLabel}>Finalizar partida</Text>
            </TouchableOpacity>
          )
        ) : (
          <TouchableOpacity style={[s.primaryBtn, Shadows.card]} onPress={() => navigation.navigate('Home')}>
            <Text style={s.primaryLabel}>Volver al inicio</Text>
          </TouchableOpacity>
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(k: number) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg * k },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 2, borderColor: Colors.border, padding: Spacing.lg * k, gap: Spacing.md * k },
  title: { ...Typography.title, fontSize: (Typography.title?.fontSize || 20) * k },
  subtitle: { ...Typography.subtitle, fontSize: (Typography.subtitle?.fontSize || 16) * k },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.bg, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.border, padding: 12 * k },
    player: { color: Colors.text, fontWeight: '800' },
    score: { color: Colors.text, fontWeight: '900' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.md, overflow: 'hidden', color: '#1F1300', fontWeight: '900' },
    ok: { backgroundColor: '#A5F3A1' },
    wrong: { backgroundColor: '#F9C0C0' },
    primaryBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 12 * k, alignItems: 'center', marginTop: Spacing.md * k },
    primaryLabel: { color: '#1F1300', fontWeight: '900' },
  });
}
