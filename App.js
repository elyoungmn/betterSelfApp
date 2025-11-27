// App.js
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, View } from 'react-native';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LanguageProvider } from './src/context/LanguageContext';
import { StoreProvider } from './src/context/StoreContext';
import { initI18n } from './src/i18n';
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
  const { t } = useTranslation();

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
          if (route.name === 'Home') iconName = 'home-outline';
          else if (route.name === 'Journal') iconName = 'book-outline';
          else if (route.name === 'CoolDown') iconName = 'leaf-outline';
          else if (route.name === 'Streaks') iconName = 'flame-outline';
          else if (route.name === 'Stats') iconName = 'stats-chart-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} options={{ title: t('tabs.home') }} />
      <Tab.Screen name="Journal" component={JournalScreen} options={{ title: t('tabs.journal') }} />
      <Tab.Screen name="CoolDown" component={CoolDownScreen} options={{ title: t('tabs.cooldown') }} />
      <Tab.Screen name="Streaks" component={StreaksScreen} options={{ title: t('tabs.streaks') }} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ title: t('tabs.stats') }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [bootReady, setBootReady] = useState(false);
  const [mustShowWelcome, setMustShowWelcome] = useState(false);
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    (async () => {
      // Initialize i18n first
      try {
        await initI18n();
        setI18nReady(true);
      } catch (e) {
        console.warn('i18n init error:', e?.message);
        setI18nReady(true); // Continue anyway
      }

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

  if (!bootReady || !i18nReady) {
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
      <LanguageProvider>
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
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
