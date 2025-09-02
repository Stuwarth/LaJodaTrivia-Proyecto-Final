import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '../ui/Theme';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import GameScreen from '../screens/GameScreen';
import RoomLobbyScreen from '../screens/RoomLobbyScreen';
import PlayMenuScreen from '../screens/PlayMenuScreen';
import FriendsPlayScreen from '../screens/FriendsPlayScreen';
import MatchmakingScreen from '../screens/MatchmakingScreen';
import QuestionScreen from '../screens/QuestionScreen';
import RevealScreen from '../screens/RevealScreen';
import ResultsScreen from '../screens/ResultsScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import SettingsScreen from '../screens/SettingsScreen.tsx';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: Colors.bg,
      card: Colors.surface,
      text: Colors.text,
      border: Colors.border,
      primary: Colors.primary,
    },
  };
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
  initialRouteName="Login"
        screenOptions={{
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.text,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: Colors.bg },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'La Joda Trivia' }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Iniciar sesión' }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Crear cuenta' }} />
        <Stack.Screen name="Game" component={GameScreen} options={{ title: 'Inicio' }} />
        <Stack.Screen name="PlayMenu" component={PlayMenuScreen} options={{ title: 'Jugar' }} />
        <Stack.Screen
          name="FriendsPlay"
          component={FriendsPlayScreen}
          options={({ navigation }) => ({
            title: 'Con amigos',
            headerRight: () => (
              <TouchableOpacity onPress={() => navigation.navigate('QRScanner' as never)}>
                <Text style={{ color: Colors.secondary, fontWeight: '800' }}>Escanear QR</Text>
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen name="Matchmaking" component={MatchmakingScreen} options={{ title: 'Emparejamiento' }} />
        <Stack.Screen name="RoomLobby" component={RoomLobbyScreen} options={{ title: 'Sala' }} />
        <Stack.Screen name="Question" component={QuestionScreen} options={{ title: 'Pregunta' }} />
        <Stack.Screen name="Reveal" component={RevealScreen} options={{ title: 'Revelación' }} />
        <Stack.Screen name="Results" component={ResultsScreen} options={{ title: 'Resultados' }} />
        <Stack.Screen name="QRScanner" component={QRScannerScreen} options={{ title: 'Escanear QR' }} />
  <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ajustes' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
