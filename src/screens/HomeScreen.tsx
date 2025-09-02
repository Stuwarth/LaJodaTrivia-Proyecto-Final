import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions, Alert, Image } from 'react-native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, Typography, Radius, Shadows } from '../ui/Theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  // Estado de progreso del usuario (simulado, reemplazar por fetch real si tienes backend)
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [progress, setProgress] = useState({
    coins: 0,
    energy: 10,
    maxEnergy: 10,
    stars: 0,
    epicChest: 0,
    epicChestMax: 55,
    streak: 0,
    vip: false,
    pass: false,
    ranking: 0,
  });

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(u => {
      setUser(u);
      // Simula progreso inicial para cuentas nuevas
      if (u && u.metadata.creationTime === u.metadata.lastSignInTime) {
        setProgress({ coins: 0, energy: 10, maxEnergy: 10, stars: 0, epicChest: 0, epicChestMax: 55, streak: 0, vip: false, pass: false, ranking: 0 });
      } else {
        // Simula progreso avanzado (reemplaza por fetch real)
        setProgress({ coins: 250, energy: 10, maxEnergy: 10, stars: 56, epicChest: 18, epicChestMax: 55, streak: 3, vip: true, pass: true, ranking: 12 });
      }
    });
    return unsubscribe;
  }, []);

  // Eliminamos el redirect automático para evitar bucles al iniciar sesión.

  const win = Dimensions.get('window');
  const tileSize = useMemo(() => Math.floor(Math.min(140, (win.width - Spacing.lg * 2 - 16) / 2)), [win.width]);
  const goPlay = useCallback(() => navigation.navigate('PlayMenu' as any), [navigation]);
  const noop = useCallback((name: string) => Alert.alert(name, 'Próximamente'), []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          {/* Perfil compacto */}
          <View style={[styles.card, Shadows.card]}>
            <View style={styles.profileRow}>
              {user?.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar}>
                  <Icon name="emoticon-excited-outline" size={32} color="#fff" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={styles.handleText}>{user?.displayName || user?.email || '@invitado'}</Text>
                <View style={styles.badgesRow}>
                  <Badge color="#34D399" label={progress.stars + ''} icon={<Icon name="star" size={16} color="#fff" />} />
                  <Badge color="#F59E0B" label={progress.energy + '/' + progress.maxEnergy} icon={<Icon name="lightning-bolt" size={16} color="#fff" />} />
                  <Badge color="#FCD34D" label={progress.coins + ''} icon={<Icon name="coin" size={16} color="#fff" />} />
                </View>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Settings' as never)} accessibilityRole="button" style={styles.settingsBtn}>
                <Icon name="cog" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Grid de features 2 columnas */}
          <View style={styles.grid}>
            <FeatureTile size={tileSize} title="Ruleta de la Suerte" color="#ECFDF5" border="#10B981" onPress={goPlay} icon={<Icon name="dice-multiple" size={32} color="#10B981" />} />
            <FeatureTile size={tileSize} title="VIP" color="#F5F3FF" border="#8B5CF6" onPress={() => noop('VIP')} icon={<Icon name="star-circle" size={32} color="#8B5CF6" />} dot={progress.vip} />
            <FeatureTile size={tileSize} title="Racha de Premios" color="#FFFBEB" border="#F59E0B" onPress={() => noop('Racha de Premios')} icon={<Icon name="fire" size={32} color="#F59E0B" />} dot={progress.streak > 0} />
            <FeatureTile size={tileSize} title="Eventos" color="#FFFBEB" border="#F59E0B" onPress={() => noop('Eventos')} icon={<Icon name="calendar-star" size={32} color="#F59E0B" />} dot />
            <FeatureTile size={tileSize} title="Pase Dorado" color="#FFF7ED" border="#FB923C" onPress={() => noop('Pase Dorado')} icon={<Icon name="ticket-confirmation" size={32} color="#FB923C" />} dot={progress.pass} />
            <FeatureTile size={tileSize} title="Ranking" color="#FFF7ED" border="#FB923C" onPress={() => noop('Ranking')} icon={<Icon name="trophy" size={32} color="#FB923C" />} dot={progress.ranking > 0} />
          </View>

          {/* Cofre épico */}
          <View style={[styles.card, Shadows.card]}>
            <Text style={styles.sectionTitle}>Cofre Épico</Text>
            <ProgressBar value={progress.epicChest} max={progress.epicChestMax} />
            <Text style={styles.progressText}>{progress.epicChest}/{progress.epicChestMax}</Text>
          </View>

          {/* Botón JUGAR grande */}
          <TouchableOpacity onPress={goPlay} activeOpacity={0.9} style={[styles.playBtn, Shadows.card]} accessibilityRole="button">
            <Icon name="play-circle" size={28} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.playText}>JUGAR</Text>
          </TouchableOpacity>
          {/** Botón de cerrar sesión se movió a Ajustes */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, padding: Spacing.lg },
  content: { width: '100%', alignSelf: 'center', gap: Spacing.lg, alignItems: 'center' },
  card: { width: '100%', maxWidth: 520, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 2, borderColor: Colors.border, padding: Spacing.md },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.secondary, borderWidth: 2, borderColor: Colors.border },
  handleText: { ...Typography.subtitle, fontWeight: '900', color: Colors.text },
  badgesRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  settingsBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border },
  grid: { width: '100%', maxWidth: 520, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  sectionTitle: { ...Typography.subtitle, fontWeight: '900', color: Colors.text },
  progressText: { color: Colors.textMuted, marginTop: 6 },
  playBtn: { width: '100%', maxWidth: 520, backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: Colors.border },
  playText: { color: '#1F1300', fontWeight: '900', fontSize: 18 },
});

const badgeStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  text: { marginLeft: 6, fontWeight: '800', color: '#1F1300' },
});

const tileStyles = StyleSheet.create({
  wrap: { borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 2, alignItems: 'center', justifyContent: 'center', gap: 8 },
  icon: { width: 40, height: 40 },
  title: { fontWeight: '900', color: Colors.text, textAlign: 'center' },
  dot: { position: 'absolute', top: 8, right: 8, width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' },
});

function Badge({ color, label, icon }: { color: string; label: string; icon?: React.ReactNode }) {
  return (
    <View style={[badgeStyles.wrap, { backgroundColor: color, borderWidth: 2, borderColor: Colors.border }]}> 
      {icon}
      <Text style={badgeStyles.text}>{label}</Text>
    </View>
  );
}

type TileProps = { size: number; title: string; color: string; border: string; onPress: () => void; icon: React.ReactNode; dot?: boolean };
const FeatureTile = React.memo(function FeatureTile({ size, title, color, border, onPress, icon, dot }: TileProps) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} accessibilityRole="button" style={{ width: size, height: size }}>
      <View style={[tileStyles.wrap, { width: '100%', height: '100%', backgroundColor: color, borderColor: border }, Shadows.card]}>
        {dot ? <View style={tileStyles.dot} /> : null}
        <View style={[tileStyles.icon, { alignItems: 'center', justifyContent: 'center' }]}>{icon}</View>
        <Text numberOfLines={2} style={tileStyles.title}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
});

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(1, value / Math.max(1, max)));
  return (
    <View style={{ width: '100%', height: 14, backgroundColor: '#E5E7EB', borderRadius: 999, borderWidth: 2, borderColor: Colors.border, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: '#F59E0B' }} />
    </View>
  );
}
