import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Colors, Spacing, Typography, Radius, Shadows } from '../ui/Theme';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

export default function GameScreen() {
  const user = auth().currentUser;
  const alias = user?.displayName || user?.email || (user?.isAnonymous ? 'Invitado' : 'Jugador');
  const { width } = useWindowDimensions();
  // Base de diseño ~390 (iPhone 12). Limitamos el scale para no exagerar.
  const scale = useMemo(() => Math.min(Math.max(width / 390, 0.85), 1.15), [width]);
  const styles = useMemo(() => makeStyles(scale), [scale]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Helper components dentro para acceder a styles responsivos
  const Badge = ({ label, color, emoji }: { label: string; color: string; emoji?: string }) => (
    <View style={[styles.badge, { backgroundColor: color }]}> 
      {emoji ? <Text style={styles.badgeEmoji}>{emoji}</Text> : null}
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );

  const MiniRound = ({ label, bg }: { label: string; bg: string }) => (
    <View style={[styles.miniRound, { backgroundColor: bg }]}> 
      <Text style={styles.miniRoundText}>{label}</Text>
    </View>
  );

  const ActionCard = ({ title, color, starred, notif }: { title: string; color: string; starred?: boolean; notif?: boolean }) => (
    <View style={[styles.actionCard, { borderColor: color }, Shadows.card]}>
      <View style={styles.actionInner}>
        <Text style={[styles.actionTitle, { color }]}>{starred ? '⭐ ' : ''}{title}</Text>
        {notif ? <View style={styles.notifDot} /> : null}
      </View>
    </View>
  );

  const BottomIcon = ({ label, emoji, active }: { label: string; emoji: string; active?: boolean }) => (
    <View style={styles.bottomItem}>
      <Text style={[styles.bottomEmoji, active && { opacity: 1 }]}>{emoji}</Text>
      <Text style={[styles.bottomLabel, active && { color: Colors.text }]}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header de perfil */}
        <View style={[styles.headerCard, Shadows.card]}> 
          <View style={styles.headerRow}>
            <View style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.handle}>@{String(alias).toLowerCase().replace(/\s+/g, '.')}</Text>
              <View style={styles.badgesRow}>
                <Badge label="56" color={Colors.secondary} emoji="⭐" />
                <Badge label="Lleno" color={Colors.warning} emoji="💧" />
                <Badge label="250" color={Colors.primary} emoji="🪙" />
              </View>
            </View>
            <View style={styles.headerButtons}>
              <MiniRound label="10" bg={Colors.danger} />
              <MiniRound label="⚙️" bg={Colors.border} />
            </View>
          </View>
        </View>

        {/* Acciones principales */}
        <View style={styles.actionsRow}>
          <ActionCard title="Ruleta de la Suerte" color={Colors.secondary} />
          <ActionCard title="VIP" color={Colors.secondary} starred />
        </View>
        <View style={styles.actionsRow}>
          <ActionCard title="Racha de Premios" color={Colors.primary} notif />
          <ActionCard title="Eventos" color={Colors.primary} notif />
        </View>
        <View style={styles.actionsRow}>
          <ActionCard title="Pase Dorado" color={Colors.warning} />
          <ActionCard title="Ranking" color={Colors.warning} />
        </View>

        {/* Progreso de cofre */}
        <View style={[styles.chestCard, Shadows.card]}>
          <Text style={styles.chestTitle}>Cofre Épico</Text>
          <View style={styles.progressBarOuter}>
            <View style={styles.progressBarInner} />
          </View>
          <Text style={styles.progressText}>18/55</Text>
        </View>

        {/* Botón grande JUGAR */}
        <TouchableOpacity
          style={[styles.playButton, Shadows.card]}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('PlayMenu')}
        >
          <Text style={styles.playLabel}>JUGAR</Text>
        </TouchableOpacity>

        {/* Barra inferior (solo visual) */}
        <View style={styles.bottomBar}>
          <BottomIcon label="Tienda" emoji="🛍️" />
          <BottomIcon label="VS" emoji="⚔️" />
          <BottomIcon label="Inicio" emoji="🏠" active />
          <BottomIcon label="Amigos" emoji="👥" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
function makeStyles(k: number) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    scroll: { padding: Spacing.lg * k, paddingBottom: Spacing.xl * k },

    // Header
    headerCard: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      padding: Spacing.md * k,
      marginBottom: Spacing.lg * k,
      borderWidth: 2,
      borderColor: Colors.border,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md * k },
    avatar: {
      width: Math.round(50 * k),
      height: Math.round(50 * k),
      borderRadius: Math.round(25 * k),
      backgroundColor: Colors.secondary,
      borderWidth: 3,
      borderColor: Colors.primary,
      marginRight: Spacing.md * k,
    },
    handle: { ...Typography.title, fontSize: 16 * k },
    badgesRow: { flexDirection: 'row', gap: 6 * k, marginTop: 4 * k },
    headerButtons: { alignItems: 'center', gap: 6 * k, marginLeft: Spacing.md * k },
    miniRound: {
      width: Math.round(28 * k),
      height: Math.round(28 * k),
      borderRadius: Math.round(14 * k),
      justifyContent: 'center',
      alignItems: 'center',
    },
    miniRoundText: { fontWeight: '800', color: Colors.text, fontSize: 12 * k },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8 * k,
      paddingVertical: 4 * k,
      borderRadius: 999,
    },
    badgeEmoji: { marginRight: 4 * k, fontSize: 12 * k },
    badgeText: { fontWeight: '800', color: '#fff', fontSize: 12 * k },

    // Action cards
    actionsRow: { flexDirection: 'row', gap: Spacing.md * k, marginBottom: Spacing.md * k },
    actionCard: {
      flex: 1,
      backgroundColor: Colors.surface,
      borderRadius: Radius.md,
      borderWidth: 2,
      padding: Spacing.md * k,
    },
    actionInner: { minHeight: 56 * k, justifyContent: 'center' },
    actionTitle: { fontWeight: '900', fontSize: 14 * k },
    notifDot: {
      position: 'absolute',
      right: 6 * k,
      top: 6 * k,
      width: 8 * k,
      height: 8 * k,
      borderRadius: 4 * k,
      backgroundColor: Colors.danger,
    },

    // Chest progress
    chestCard: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      padding: Spacing.md * k,
      borderWidth: 2,
      borderColor: Colors.border,
      marginTop: Spacing.sm * k,
      marginBottom: Spacing.md * k,
    },
    chestTitle: { ...Typography.title, fontSize: 16 * k, marginBottom: 6 * k },
    progressBarOuter: {
      backgroundColor: Colors.border,
      height: 14 * k,
      borderRadius: 999,
      overflow: 'hidden',
    },
    progressBarInner: {
      width: '33%',
      height: '100%',
      backgroundColor: Colors.warning,
    },
    progressText: { ...Typography.label, textAlign: 'right', marginTop: 4 * k, fontSize: 12 * k },

    // Play button
    playButton: {
      backgroundColor: Colors.primary,
      paddingVertical: 16 * k,
      borderRadius: Radius.lg,
      alignItems: 'center',
      marginBottom: Spacing.lg * k,
    },
    playLabel: { fontWeight: '900', fontSize: 18 * k, color: '#1F1300', letterSpacing: 0.5 },

    // Bottom bar
    bottomBar: {
      flexDirection: 'row',
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      paddingVertical: 8 * k,
      paddingHorizontal: 12 * k,
      borderWidth: 2,
      borderColor: Colors.border,
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    bottomItem: { alignItems: 'center', flex: 1 },
    bottomEmoji: { fontSize: 16 * k, opacity: 0.8, marginBottom: 2 * k },
    bottomLabel: { fontSize: 11 * k, color: Colors.textMuted },
  });
}
