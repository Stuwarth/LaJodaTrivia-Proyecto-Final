import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Platform } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '../ui/Theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { joinRoom } from '../services/rooms';
import { toast } from '../ui/toast';

export default function QRScannerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [granted, setGranted] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const perms: any = require('react-native-permissions');
        const { request, PERMISSIONS, RESULTS } = perms;
        const res = await request(
          Platform.select({
            ios: PERMISSIONS.IOS.CAMERA,
            android: PERMISSIONS.ANDROID.CAMERA,
            default: undefined,
          }) as any
        );
        if (!mounted) return;
        setGranted(res === RESULTS.GRANTED || res === RESULTS.LIMITED || res === 'granted');
      } catch {
        // permissions lib not installed; assume granted and let scanner handle it / fallback UI guide
        if (!mounted) return;
        setGranted(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const onScanned = async (text: string) => {
    try {
      const code = text.trim();
      if (!code) return;
      await joinRoom(code);
      navigation.replace('RoomLobby', { code });
    } catch (e: any) {
      toast(e?.message || 'No se pudo unir a la sala');
    }
  };

  // Try to load a real scanner if installed
  let Scanner: React.ReactNode = null;
  try {
    // 1) Prefer camera-kit (no RNCamera). Intentar Screen, si no, Camera
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const camkit: any = require('react-native-camera-kit');
    const CameraKitCameraScreen = camkit?.CameraKitCameraScreen;
    const Camera = camkit?.Camera;
    if (granted) {
      if (typeof CameraKitCameraScreen === 'function') {
        Scanner = (
          <CameraKitCameraScreen
            scanBarcode
            onReadCode={(e: any) => onScanned(e?.nativeEvent?.codeStringValue || '')}
            showFrame
            laserColor={Colors.secondary}
            frameColor={Colors.primary}
            hideControls
          />
        );
      } else if (typeof Camera === 'function') {
        Scanner = (
          <Camera
            style={{ flex: 1 }}
            scanBarcode={true}
            onReadCode={(e: any) => onScanned(e?.nativeEvent?.codeStringValue || e?.codeStringValue || '')}
          />
        );
      } else {
        throw new Error('Camera kit components not found');
      }
    } else {
      Scanner = (
        <View style={styles.card}>
          <Text style={styles.title}>Permiso de cámara requerido</Text>
          <Text style={styles.subtitle}>Concede el acceso a la cámara para escanear QR.</Text>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelLabel}>Volver</Text>
          </TouchableOpacity>
        </View>
      );
    }
  } catch (e) {
    // 2) Sin libs válidas: UI de guía
    Scanner = (
      <View style={styles.card}>
        <Text style={styles.title}>Escáner QR</Text>
        <Text style={styles.subtitle}>Instala la opción recomendada:</Text>
        <Text style={styles.codeLine}>npm install react-native-camera-kit react-native-permissions</Text>
        <Text style={styles.subtitle}>Luego limpia y recompila la app.</Text>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelLabel}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <SafeAreaView style={styles.safe}>{Scanner}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg },
  card: { backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.lg, gap: 8 },
  title: { ...Typography.title },
  subtitle: { ...Typography.subtitle },
  codeLine: { color: Colors.text, fontFamily: 'monospace' },
  cancelBtn: { backgroundColor: Colors.danger, paddingVertical: 10, borderRadius: Radius.md, alignItems: 'center', marginTop: Spacing.md },
  cancelLabel: { color: '#1F1300', fontWeight: '900' },
});
