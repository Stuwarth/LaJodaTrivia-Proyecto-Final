import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { Colors, Spacing, Typography, Radius, Shadows } from '../ui/Theme';

export default function PlayMenuScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const Card = ({ title, subtitle, color, onPress }: { title: string; subtitle: string; color: string; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={[styles.card, { borderColor: color }, Shadows.card]}>
      <View>
        <Text style={[styles.cardTitle, { color }]}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>¡Escoge tu modo de juego!</Text>
        <Card
          title="Modo clásico"
          subtitle="Emparejamiento aleatorio"
          color={Colors.secondary}
          onPress={() => navigation.navigate('Matchmaking')}
        />
        <Card
          title="Jugar con amigos"
          subtitle="Crea una sala o únete con un código"
          color={Colors.primary}
          onPress={() => navigation.navigate('FriendsPlay')}
        />
        <Card
          title="Desafío diario"
          subtitle="Un jugador"
          color={Colors.warning}
          onPress={() => Alert.alert('Próximamente', 'Desafío diario en desarrollo')}
        />
        <Card
          title="Duelo en tiempo real"
          subtitle="PvP"
          color={Colors.danger}
          onPress={() => Alert.alert('Próximamente', 'Duelo en tiempo real en desarrollo')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: Spacing.lg, gap: Spacing.md },
  header: { ...Typography.title, marginBottom: Spacing.sm },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 2,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  cardTitle: { fontSize: 18, fontWeight: '900' },
  cardSubtitle: { ...Typography.label, marginTop: 4 },
});
