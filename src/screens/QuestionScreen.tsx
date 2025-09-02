import React, { useEffect, useMemo, useRef, useState } from 'react';
import database from '@react-native-firebase/database';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Animated, Easing, ScrollView } from 'react-native';
import { Colors, Spacing, Typography, Radius, Shadows } from '../ui/Theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { submitAnswer, goToReveal } from '../services/game';
import { listenRoom, RoomState } from '../services/rooms';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'Question'>;

export default function QuestionScreen({ route }: Props) {
  const { code } = route.params;
  const uid = auth().currentUser?.uid;
  const navigation = useNavigation();
  const [room, setRoom] = useState<RoomState | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<null | { ok: boolean; label: string }>(null);
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const [remainingMs, setRemainingMs] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerInitializedRef = useRef(false);
  const prevRemainingRef = useRef<number>(-1);
  const [serverOffset, setServerOffset] = useState<number>(0);
  const submittingRef = useRef(false);
  const k = 1;
  const s = useMemo(() => makeStyles(k), [k]);

  useEffect(() => {
    const off = listenRoom(code, setRoom);
    return off;
  }, [code]);

  // Keep server time offset in sync to compute countdown against server clock
  useEffect(() => {
    const ref = database().ref('.info/serverTimeOffset');
    const handler = ref.on('value', (snap) => {
      setServerOffset((snap.val() as number) || 0);
    });
    return () => { ref.off('value', handler as any); };
  }, []);

  useEffect(() => {
    if (!room) return;
    if (room.stage === 'reveal') {
      // @ts-ignore
      navigation.replace('Reveal', { code });
    } else if (room.stage === 'results') {
      // @ts-ignore
      navigation.replace('Results', { code });
    }
  }, [room?.stage, navigation, code]);

  const round = (room as any)?.currentRound || 1;
  const question = (room as any)?.rounds?.[round]?.question;
  const answers = (room as any)?.rounds?.[round]?.answers || {};
  const roundTimer = (room as any)?.roundTimer || null;

  useEffect(() => {
    if (!roundTimer) {
      setRemainingMs(0);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      timerInitializedRef.current = false;
      return;
    }
    const update = () => {
      const end = (roundTimer.startAt || 0) + (roundTimer.durationMs || 0);
      const now = Date.now() + serverOffset;
      const rem = Math.max(0, end - now);
      setRemainingMs(rem);
    };
    update();
    // mark as initialized after first computation
    timerInitializedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(update, 200);
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [roundTimer?.startAt, roundTimer?.durationMs, serverOffset]);

  // Auto reveal when timer hits zero (host only)
  useEffect(() => {
    const isHost = uid && room?.host === uid;
    if (!room || room.stage !== 'question' || !isHost) return;
    // Avoid firing on initial render before timer has computed at least once
    if (!timerInitializedRef.current) return;
    // Only trigger on edge: from >0 to 0
    const prev = prevRemainingRef.current;
    prevRemainingRef.current = remainingMs;
    if (prev > 0 && remainingMs === 0 && roundTimer) {
      // prevent multiple triggers by checking stage & remaining
      goToReveal(code).catch(() => {});
    }
  }, [remainingMs, room?.stage, roundTimer, code, uid]);

  if (!question) {
    return (
      <SafeAreaView style={s.safe}> 
        <ActivityIndicator color={Colors.secondary} />
      </SafeAreaView>
    );
  }

  const isHost = uid && room?.host === uid;
  const answeredCount = Object.keys(answers).length;
  const totalPlayers = Object.keys((room as any)?.players || {}).length || 1;
  const seconds = Math.ceil(remainingMs / 1000);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: Spacing.lg }} keyboardShouldPersistTaps="handled">
      <View style={[s.card, Shadows.card]}>
        {/* Header estilo fase 2 */}
        <View style={[s.headerLine]}>
          <View style={s.catBadge} />
          <Text style={s.catTitle}>{(question as any)?.category?.toUpperCase?.() || 'CATEGORÍA'}</Text>
          <View style={s.timerBubble} accessibilityRole="text" accessibilityLabel={`Tiempo restante ${seconds} segundos`}>
            <Text style={s.timerBubbleText}>{seconds}</Text>
          </View>
        </View>
        <Text style={s.progress}>{answeredCount}/{totalPlayers} respondieron</Text>
        {/* Avatares con estado de respuesta */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
          {Object.entries((room as any)?.players || {}).map(([pid, p]: any) => {
            const answered = !!answers[pid];
            return (
              <View key={pid} style={{ alignItems: 'center' }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.secondary, borderWidth: 2, borderColor: answered ? Colors.success : Colors.border }} />
                <Text style={{ fontSize: 10, color: Colors.textMuted, maxWidth: 60 }} numberOfLines={1}>{p.alias || 'Jugador'}</Text>
              </View>
            );
          })}
        </View>
        <Text style={s.prompt}>{question.prompt}</Text>
        <View style={{ gap: 8 }}>
          {question.options.map((opt: any, idx: number) => (
            <TouchableOpacity
              key={idx}
              style={[
                s.option,
                selected === null
                  ? undefined
                  : selected === idx
                  ? (opt.correct ? s.optionCorrectSel : s.optionWrongSel)
                  : s.optionDisabled,
              ]}
              onPress={async () => {
                if (selected !== null || submittingRef.current) return;
                submittingRef.current = true;
                setSelected(idx);
                try {
                  await submitAnswer(code, idx);
                } catch (e) {}
                // feedback local inmediato
                const ok = !!opt.correct;
                setFeedback({ ok, label: ok ? '¡ESTUPENDO!' : '¡INCORRECTO!' });
                feedbackAnim.setValue(0);
                Animated.timing(feedbackAnim, { toValue: 1, duration: 260, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }).start(() => {
                  setTimeout(() => {
                    Animated.timing(feedbackAnim, { toValue: 0, duration: 180, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => setFeedback(null));
                  }, 700);
                });
                // keep disabled for the rest of the question lifecycle
              }}
              accessibilityRole="button"
              accessibilityState={{ disabled: selected !== null }}
              activeOpacity={0.9}
            >
              <Text style={s.optionText}>{opt.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Overlay de feedback estilo fase 3 */}
        {feedback && (
          <Animated.View
            pointerEvents="none"
            style={[
              s.feedback,
              {
                opacity: feedbackAnim,
                transform: [
                  {
                    scale: feedbackAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }),
                  },
                ],
                backgroundColor: feedback.ok ? 'rgba(46, 204, 113, 0.85)' : 'rgba(231, 76, 60, 0.85)',
              },
            ]}
          >
            <Text style={s.feedbackText}>{feedback.label}</Text>
          </Animated.View>
        )}
        {isHost && (
          <TouchableOpacity style={[s.primaryBtn, Shadows.card]} onPress={() => goToReveal(code)} activeOpacity={0.9}>
            <Text style={s.primaryLabel}>Revelar</Text>
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
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    // Header estilo fase 2
    headerLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    catBadge: { width: 32 * k, height: 32 * k, borderRadius: 16 * k, backgroundColor: Colors.warning, borderColor: Colors.border, borderWidth: 2 },
    catTitle: { ...Typography.subtitle, fontWeight: '900', flex: 1, textAlign: 'center', color: Colors.text },
    timer: { color: '#1F1300', fontWeight: '900', backgroundColor: Colors.secondary, borderRadius: 999, paddingHorizontal: 10 * k, paddingVertical: 4 * k },
    timerBubble: { width: 34 * k, height: 34 * k, borderRadius: 17 * k, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.border },
    timerBubbleText: { color: '#1F1300', fontWeight: '900' },
    progress: { color: Colors.textMuted },
    prompt: { ...Typography.subtitle },
    option: { backgroundColor: Colors.bg, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.border, padding: 12 * k },
    optionSelected: { borderColor: Colors.primary, backgroundColor: '#FFF4CC' },
    optionCorrectSel: { backgroundColor: '#D6F5D6', borderColor: Colors.success },
    optionWrongSel: { backgroundColor: '#FDE2E2', borderColor: Colors.danger },
    optionDisabled: { opacity: 0.6 },
    optionText: { color: Colors.text, fontWeight: '700' },
    // Overlay feedback estilo fase 3
    feedback: { position: 'absolute', left: Spacing.lg * k, right: Spacing.lg * k, top: '38%', paddingVertical: 12 * k, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
    feedbackText: { color: '#1F1300', fontWeight: '900', fontSize: 24 },
    primaryBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 12 * k, alignItems: 'center', marginTop: Spacing.md * k },
    primaryLabel: { color: '#1F1300', fontWeight: '900' },
  });
}
