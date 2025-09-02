import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Share, Alert, Modal, Animated, Easing, Dimensions, ScrollView, useWindowDimensions } from 'react-native';
import database from '@react-native-firebase/database';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors, Spacing, Typography, Radius, Shadows } from '../ui/Theme';
import { listenPresence, listenRoom, RoomState, leaveRoom, listenSpin, setSpin, clearSpin, SpinState } from '../services/rooms';
import { startGame } from '../services/game';
import { getRandomQuestion, type TriviaQuestion } from '../services/questions';
import { listCategories } from '../services/questions';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import Roulette from '../components/Roulette';
import { joinRoom } from '../services/rooms';

 type Props = NativeStackScreenProps<RootStackParamList, 'RoomLobby'>;

export default function RoomLobbyScreen({ route }: Props) {
  const { code } = route.params;
  const { width, height } = useWindowDimensions();
  const k = useMemo(() => Math.min(Math.max(width / 392, 0.85), 1.1), [width]);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [presence, setPresence] = useState<Record<string, any> | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [setupOpen, setSetupOpen] = useState(false);
  const [spin, setSpinState] = useState<SpinState | null>(null);
  const uid = auth().currentUser?.uid;
  const navigation = useNavigation();

  useEffect(() => {
    const offRoom = listenRoom(code, setRoom);
    const offPresence = listenPresence(code, setPresence);
    const offSpin = listenSpin(code, setSpinState);
    return () => {
      offRoom();
      offPresence();
      offSpin();
    };
  }, [code]);

  // Join only after room snapshot shows it exists and if I'm not yet listed as player
  useEffect(() => {
    const uid = auth().currentUser?.uid;
    if (!room || !uid) return;
    const players = (room as any)?.players || {};
    if (!players[uid]) {
      joinRoom(code).catch(() => {});
    }
    // After joining (present in players), clear matched notification for this user
    if (players[uid]) {
      try { database().ref(`/queue/classic/matched/${uid}`).remove(); } catch {}
    }
  }, [room?.code, (room as any)?.players, code]);

  useEffect(() => {
    // Load categories from RTDB so host can spin
    listCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (room?.stage === 'question') {
      // Navegar al flujo de juego cuando el host inicia
  // @ts-ignore
  navigation.replace('Question', { code });
    }
  }, [room?.stage, navigation, code]);

  const players = useMemo(() => Object.entries(presence || {}).map(([uid, p]) => ({ uid, ...p })), [presence]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.container, { padding: Spacing.lg * k }]} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
        <View style={[styles.header, Shadows.card]}> 
          <Text style={[styles.title, { fontSize: 22 * k }]}>Sala</Text>
          <Text style={[styles.code, { fontSize: 28 * k }]}>{code}</Text>
          <Text style={[styles.subtitle, { fontSize: 14 * k }]}>{room?.stage === 'lobby' ? 'En Lobby' : room?.stage}</Text>
          <View style={[styles.headerBtns, { gap: 8 * k }]}>
            <TouchableOpacity
              style={[styles.btn, styles.shareBtn, { paddingVertical: 10 * k, paddingHorizontal: 14 * k }]}
              onPress={async () => {
                try {
                  await Share.share({ message: `Únete a mi sala de La Joda Trivia: ${code}` });
                } catch (e) {
                  Alert.alert('No se pudo compartir');
                }
              }}
            >
              <Text style={styles.btnLabel}>Compartir</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.leaveBtn, { paddingVertical: 10 * k, paddingHorizontal: 14 * k }]}
              onPress={async () => {
                try {
                  await leaveRoom(code);
                } catch (e) {
                  // noop
                }
                // @ts-ignore
                navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
              }}
            >
              <Text style={styles.btnLabel}>Salir</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, Shadows.card]}> 
          <Text style={[styles.sectionTitle, { fontSize: 16 * k }]}>Jugadores ({players.length})</Text>
          <View>
            {players.map((item, idx) => (
              <View key={item.uid} style={[styles.playerRow, idx > 0 ? { marginTop: 8 } : null]}>
                <View style={[styles.avatar, { width: 28 * k, height: 28 * k, borderRadius: 14 * k }]} />
                <Text style={[styles.playerName, { fontSize: 14 * k }]}>{item.alias || 'Invitado'}</Text>
                {item.online ? <Text style={[styles.badgeOnline, { fontSize: 12 * k }]}>online</Text> : null}
              </View>
            ))}
          </View>
          {uid && room?.host === uid && (
            <TouchableOpacity style={[styles.startBtn, Shadows.card, { paddingVertical: 12 * k }]} onPress={() => setSetupOpen(true)} activeOpacity={0.9}>
              <Text style={[styles.startLabel, { fontSize: 14 * k }]}>Iniciar juego</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* QR opcional si la lib está disponible */}
        <View style={[styles.card, Shadows.card, { marginTop: Spacing.lg }] }>
          <Text style={[styles.sectionTitle, { fontSize: 16 * k }]}>Código QR</Text>
          <QR code={code} size={Math.max(140, Math.min(width * 0.6, 220))} />
          <Text style={[styles.hint, { fontSize: 12 * k }]}>Escanea o comparte el código para unirse.</Text>
        </View>

        <Text style={[styles.hint, { fontSize: 12 * k }]}>El host puede iniciar la partida cuando estén todos listos.</Text>
      </ScrollView>
      <SetupModal
        visible={setupOpen}
        onClose={() => setSetupOpen(false)}
        code={code}
        isHost={uid === room?.host}
        players={players}
        categories={categories}
        spin={spin}
        usedIds={((room as any)?.used as string[]) || []}
      />
    </SafeAreaView>
  );
}

// Lightweight QR renderer (optional dep). If lib missing, show a hint text.
function QR({ code, size = 160 }: { code: string; size?: number }) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const QRCode = require('react-native-qrcode-svg').default as any;
  return <QRCode value={code} size={size} />;
  } catch (e) {
    return <Text style={{ color: Colors.textMuted }}>Instala react-native-qrcode-svg para mostrar QR</Text>;
  }
}

function SetupModal({ visible, onClose, code, isHost, players, categories, spin, usedIds }: { visible: boolean; onClose: () => void; code: string; isHost: boolean; players: any[]; categories: string[]; spin: SpinState | null; usedIds: string[] }) {
  const canSpin = categories && categories.length > 0;
  const angle = useMemo(() => new Animated.Value(0), []);
  const bottleAngle = useMemo(() => new Animated.Value(0), []);
  const win = Dimensions.get('window');
  // Wheel should be as large as possible within modal margins and safe areas
  const maxWheel = Math.min(win.width - Spacing.lg * 2, win.height * 0.8);
  const size = Math.floor(maxWheel);
  // Botella más pequeña para asemejar referencia
  const bottleSize = Math.max(88, Math.min(size * 0.32, size * 0.38));
  const [result, setResult] = useState<string | null>(null);
  const [prefetchedQ, setPrefetchedQ] = useState<TriviaQuestion | null>(null);
  // Show lightweight wheel for the first paint to reduce open-lag, then switch to full
  const [lightWheel, setLightWheel] = useState<boolean>(true);
  useEffect(() => {
    if (!visible) return;
    setLightWheel(true);
    const t = setTimeout(() => setLightWheel(false), 250);
    return () => clearTimeout(t);
  }, [visible]);
  const processedSpinAt = useRef<number | null>(null);
  const completionHandled = useRef<boolean>(false);
  // Intentar cargar spin.svg (botella)
  let SpinIcon: any = null;
  try {
    // @ts-ignore
    const mod = require('../../assets/icons/spin.svg');
    const candidate = (mod && (mod.default ?? mod)) as any;
    const isRenderableComponent =
      typeof candidate === 'function' ||
      (candidate && typeof candidate === 'object' && (typeof candidate.render === 'function' || candidate.$$typeof));
    SpinIcon = isRenderableComponent ? candidate : null;
  } catch (e) {
    SpinIcon = null;
  }
  // Si la tapa no apunta arriba por defecto, ajustar
  const bottlePointerOffsetDeg = 0;

  // Paleta Bolivia inspirada (bandera + Andes + lago + atardecer + minerales)
  const baseColors = useMemo(
    () => ['#FFD400', '#D81E05', '#007A33', '#0F47AF', '#FF7F00', '#6A0DAD', '#12B3A8', '#8C4A2F'],
    []
  );
  const strHash = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  };
  const wheelColors = useMemo(() =>
    (categories || []).map((c) => baseColors[strHash(c) % baseColors.length])
  , [categories, baseColors]);

  // Avoid creating new interpolation nodes on each render
  const wheelRotate = useMemo(() => angle.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '0deg'] }), [angle]);
  const bottleRotate = useMemo(() => bottleAngle.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }), [bottleAngle]);

  useEffect(() => {
    if (!spin || !canSpin) return;
    if (processedSpinAt.current === spin.startedAt) return; // already processed this spin event
    processedSpinAt.current = spin.startedAt;
    completionHandled.current = false;
    // Deterministic index from seed
    const idx = Math.abs(spin.seed) % categories.length;
    const selected = categories[idx];
    setResult(selected);
    // Prefetch question locally using current room.used to avoid extra RTDB call upon start
    (async () => {
      try {
        const q = await getRandomQuestion(selected, usedIds || []);
        setPrefetchedQ(q);
      } catch (e) {
        setPrefetchedQ(null);
      }
    })();
    // Animate with easing; compute total rotations based on seed
    const turns = 4 + (Math.abs(spin.seed) % 4); // 4..7 turns
    const sectorAngle = 360 / categories.length;
    const targetAngle = turns * 360 + (idx) * sectorAngle + bottlePointerOffsetDeg; // tapa apunta al sector
    bottleAngle.setValue(0);
    Animated.timing(bottleAngle, {
      toValue: targetAngle,
      duration: spin.durationMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(async () => {
      // Only host proceeds to start the game after spin
      if (completionHandled.current) return;
      if (isHost && selected) {
        try {
          // Store result for audit/sync before clearing
          await database().ref(`/rooms/${code}/spin/result`).set(selected);
          await clearSpin(code);
          await startGame(code, selected, 15000, prefetchedQ);
          completionHandled.current = true;
        } catch (e) {
          Alert.alert('No se pudo iniciar la partida');
        }
      }
    });
  }, [spin?.startedAt, canSpin, categories, angle, code, isHost, usedIds, prefetchedQ]);

  const startSpin = async () => {
    if (!isHost || !canSpin) return;
    const seed = Math.floor(Math.random() * 1e9);
    const payload: SpinState = { seed, startedAt: Date.now(), durationMs: 1800 };
    await setSpin(code, payload);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, Shadows.card]}>
          <Text style={styles.sectionTitle}>Jugadores ({players.length})</Text>
          <ScrollView style={{ maxHeight: 140, marginBottom: 12 }}>
            {players.map((item: any, idx: number) => (
              <View key={item.uid} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}>
                <View style={[styles.avatar, { marginRight: 8 }]} />
                <Text style={styles.playerName}>{item.alias || 'Invitado'}</Text>
                {item.online ? <Text style={styles.badgeOnline}>online</Text> : null}
              </View>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Ruleta de categorías</Text>
          {!canSpin ? (
            <Text style={styles.hint}>No hay categorías disponibles</Text>
          ) : (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
                <Roulette
                  size={size}
                  categories={categories}
                  angle={wheelRotate}
                  colors={wheelColors}
                  light={!!spin || lightWheel}
                />
                {/* Botella giratoria como botón */}
                <Animated.View
                  style={{
                    position: 'absolute',
                    transform: [{ rotate: bottleRotate }],
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    disabled={!isHost || !!spin}
                    onPress={startSpin}
                    style={{ alignItems: 'center', justifyContent: 'center' }}
                    accessibilityRole="button"
                    accessibilityLabel={!!spin ? 'Girando' : 'Girar'}
                  >
                    {SpinIcon ? (
                      <SpinIcon width={bottleSize} height={bottleSize} />
                    ) : (
                      <>
                        {/* Fallback vector bottle */}
                        <View
                          style={{
                            width: bottleSize * 0.7,
                            height: bottleSize * 0.18,
                            backgroundColor: Colors.surface,
                            borderRadius: size * 0.06,
                            borderWidth: 3,
                            borderColor: Colors.border,
                            shadowColor: '#000',
                            shadowOpacity: 0.2,
                            shadowRadius: 6,
                            elevation: 4,
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: !isHost || !!spin ? 0.8 : 1,
                          }}
                        >
                          <Text style={{ color: '#1F1300', fontWeight: '900' }}>{!!spin ? 'GIRANDO' : 'GIRAR'}</Text>
                        </View>
                        <View
                          style={{
                            marginTop: -2,
                            width: bottleSize * 0.11,
                            height: bottleSize * 0.11,
                            borderTopLeftRadius: bottleSize * 0.055,
                            borderTopRightRadius: bottleSize * 0.055,
                            backgroundColor: Colors.warning,
                            borderWidth: 2,
                            borderColor: Colors.border,
                          }}
                        />
                      </>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
          )}

          <TouchableOpacity style={[styles.leaveBtn, { marginTop: 12, alignSelf: 'center', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 }]} onPress={onClose}>
            <Text style={styles.btnLabel}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1 },
  header: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  title: { ...Typography.title, marginBottom: 6 },
  code: { fontSize: 26, fontWeight: '900', color: Colors.secondary },
  subtitle: { ...Typography.subtitle, marginTop: 4 },
  headerBtns: { flexDirection: 'row', gap: 8, marginTop: 10 },
  btn: { borderRadius: Radius.md, paddingVertical: 10, paddingHorizontal: 14 },
  shareBtn: { backgroundColor: Colors.primary },
  leaveBtn: { backgroundColor: Colors.danger },
  btnLabel: { fontWeight: '900', color: '#1F1300' },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  sectionTitle: { fontWeight: '900', fontSize: 16, marginBottom: 10, color: Colors.text },
  playerRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.secondary, marginRight: 10 },
  playerName: { color: Colors.text, fontWeight: '600' },
  badgeOnline: { marginLeft: 'auto', color: '#10B981', fontWeight: '700' },
  startBtn: { marginTop: Spacing.lg, backgroundColor: Colors.warning, borderRadius: Radius.lg, paddingVertical: 12, alignItems: 'center' },
  startLabel: { fontWeight: '900', color: '#1F1300' },

  hint: { ...Typography.label, textAlign: 'center', marginTop: Spacing.lg },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 2, borderColor: Colors.border, width: '100%' },
});
