// App.js
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StoreProvider } from './src/context/StoreContext';
import CoolDownScreen from './src/screens/CoolDownScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import JournalScreen from './src/screens/JournalScreen';
import StatsScreen from './src/screens/StatsScreen';
import StreaksScreen from './src/screens/StreaksScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';

// --- Handler global de notificaciones (ok fuera de componentes; no usa hooks) ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// --- Tema oscuro de navegación ---
const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#22c55e',
    background: '#0b1220',
    card: '#0f172a',
    text: '#e5e7eb',
    border: '#1f2937',
    notification: '#22c55e',
  },
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// --- Tabs principales ---
function RootTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#e5e7eb',
        headerTitleStyle: { fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#1f2937',
          height: Platform.OS === 'android' ? 90 : 64,
          paddingBottom: Platform.OS === 'android' ? 30 : 10,
          paddingTop: Platform.OS === 'android' ? 12 : 6,
        },
        tabBarActiveTintColor: '#22c55e',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarIcon: ({ color, size }) => {
          let iconName = 'ellipse-outline';
          if (route.name === 'Inicio') iconName = 'home-outline';
          else if (route.name === 'Diario') iconName = 'book-outline';
          else if (route.name === 'CoolDown') iconName = 'leaf-outline';
          else if (route.name === 'Rachas') iconName = 'flame-outline';
          else if (route.name === 'Estadísticas') iconName = 'stats-chart-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Diario" component={JournalScreen} options={{ title: 'Diario' }} />
      <Tab.Screen name="CoolDown" component={CoolDownScreen} options={{ title: 'CoolDown' }} />
      <Tab.Screen name="Rachas" component={StreaksScreen} options={{ title: 'Rachas' }} />
      <Tab.Screen name="Estadísticas" component={StatsScreen} options={{ title: 'Estadísticas' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [bootReady, setBootReady] = useState(false);
  const [mustShowWelcome, setMustShowWelcome] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#22c55e',
          });
        }
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          await Notifications.requestPermissionsAsync();
        }
      } catch (e) {
        console.warn('Notif setup error:', e?.message);
      }

      try {
        const seen = await AsyncStorage.getItem('welcome_seen'); // '1' si ya se vio
        console.log('welcome_seen =>', seen);
        setMustShowWelcome(!seen); // si NO existe -> muestra Welcome
      } finally {
        setBootReady(true);
      }
    })();
  }, []);

  if (!bootReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0b1220',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color="#22c55e" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StoreProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="light" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {mustShowWelcome ? (
              // 🌟 Árbol cuando hay que mostrar la bienvenida
              <>
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="Root" component={RootTabs} />
              </>
            ) : (
              // 🌿 Árbol normal (sin bienvenida)
              <Stack.Screen name="Root" component={RootTabs} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
