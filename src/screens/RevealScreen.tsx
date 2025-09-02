import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
import { Colors, Spacing, Typography, Radius, Shadows } from '../ui/Theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { goToResults } from '../services/game';
import { listenRoom, RoomState } from '../services/rooms';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';

 type Props = NativeStackScreenProps<RootStackParamList, 'Reveal'>;

export default function RevealScreen({ route }: Props) {
  const { code } = route.params;
  const uid = auth().currentUser?.uid;
  const navigation = useNavigation();
  const [room, setRoom] = useState<RoomState | null>(null);
  const { width } = useWindowDimensions();
  const k = useMemo(() => Math.min(Math.max(width / 392, 0.85), 1.15), [width]);
  const s = useMemo(() => makeStyles(k), [k]);

  useEffect(() => {
    const off = listenRoom(code, setRoom);
    return off;
  }, [code]);

  useEffect(() => {
    if (!room) return;
    if (room.stage === 'results') {
      // @ts-ignore
      navigation.replace('Results', { code });
    }
  }, [room?.stage, navigation, code]);

  const round = (room as any)?.currentRound || 1;
  const qnode = (room as any)?.rounds?.[round] || {};
  const question = qnode?.question;
  const answers = qnode?.answers || {};

  if (!question) {
    return (
      <SafeAreaView style={s.safe}> 
        <ActivityIndicator color={Colors.secondary} />
      </SafeAreaView>
    );
  }

  const correctIndex = question.options.findIndex((o: any) => o.correct);
  const counts: number[] = question.options.map(() => 0);
  Object.values(answers || {}).forEach((a: any) => {
    if (typeof a?.optionIndex === 'number' && counts[a.optionIndex] !== undefined) counts[a.optionIndex]++;
  });
  const total = Object.keys((room as any)?.players || {}).length || 0;
  const isHost = uid && room?.host === uid;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: Spacing.lg * k }} keyboardShouldPersistTaps="handled">
      <View style={[s.card, Shadows.card]}>
        <Text style={s.title}>Respuesta correcta</Text>
        <Text style={s.prompt}>{question.prompt}</Text>
        <View style={{ gap: 8 }}>
          {question.options.map((opt: any, idx: number) => (
            <View key={idx} style={[s.option, idx === correctIndex && s.optionCorrect]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={s.optionText}>{opt.text}</Text>
                <Text style={[s.count, idx === correctIndex && s.countCorrect]}>{counts[idx]}</Text>
              </View>
            </View>
          ))}
        </View>
        <Text style={s.legend}>{`Votos: ${Object.keys(answers).length}/${total}`}</Text>
        {isHost && (
          <TouchableOpacity style={[s.primaryBtn, Shadows.card]} onPress={() => goToResults(code)} activeOpacity={0.9}>
            <Text style={s.primaryLabel}>Ver resultados</Text>
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
  prompt: { ...Typography.subtitle, fontSize: (Typography.subtitle?.fontSize || 16) * k },
  option: { backgroundColor: Colors.bg, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.border, padding: 12 * k },
  optionCorrect: { backgroundColor: '#D6F5D6', borderColor: '#4CAF50' },
  optionText: { color: Colors.text, fontWeight: '700', fontSize: 14 * k },
  count: { color: Colors.textMuted, fontWeight: '900' },
  countCorrect: { color: Colors.success },
  legend: { color: Colors.textMuted, marginTop: 8, fontWeight: '600' },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 12 * k, alignItems: 'center', marginTop: Spacing.md * k },
  primaryLabel: { color: '#1F1300', fontWeight: '900', fontSize: 14 * k },
  });
}
