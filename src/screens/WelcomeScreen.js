import React, { useEffect, useMemo, useRef, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Animated, Text, TouchableOpacity, View } from 'react-native';

// índice determinístico por día (local)
const getDailyIndex = (quotesLength) => {
  const dayNumber = Math.floor(new Date().setHours(0, 0, 0, 0) / 86_400_000);
  return dayNumber % quotesLength;
};

export default function WelcomeScreen() {
  const nav = useNavigation();
  const { t } = useTranslation();
  const quotes = t('welcome.quotes', { returnObjects: true });
  const [idx, setIdx] = useState(() => getDailyIndex(quotes.length));

  // animaciones
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.98)).current;

  // timer auto-cierre 7s
  const autoTimerRef = useRef(null);

  const quote = useMemo(() => quotes[idx], [idx, quotes]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();

    // programar cierre automático a los 7s
    autoTimerRef.current = setTimeout(async () => {
      await AsyncStorage.setItem('welcome_seen', '1');
      nav.reset({ index: 0, routes: [{ name: 'Root' }] });
    }, 7000);

    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, [fade, scale, nav]);

  // por si se queda abierta, actualizar frase al pasar medianoche
  useEffect(() => {
    let t;
    const scheduleMidnightTick = () => {
      const now = new Date();
      const next = new Date();
      next.setHours(24, 0, 0, 0);
      t = setTimeout(() => {
        setIdx(getDailyIndex(quotes.length));
        scheduleMidnightTick();
      }, next.getTime() - now.getTime());
    };
    scheduleMidnightTick();
    return () => clearTimeout(t);
  }, [quotes.length]);

  const nextQuote = () => {
    Animated.sequence([
      Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
    setIdx(v => (v + 1) % quotes.length);
  };

  const onStart = async () => {
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    await AsyncStorage.setItem('welcome_seen', '1');
    nav.reset({ index: 0, routes: [{ name: 'Root' }] });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0b1220', padding: 24, justifyContent: 'center' }}>
      <Text style={{ color: '#22c55e', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>{t('welcome.title')}</Text>
      <Text style={{ color: '#e5e7eb', fontSize: 28, fontWeight: '800', marginBottom: 24 }}>{t('welcome.subtitle')}</Text>

      <Animated.View style={{ opacity: fade, transform: [{ scale }] }}>
        <Text style={{ color: '#e5e7eb', fontSize: 20, lineHeight: 30, fontStyle: 'italic' }}>
          "{quote.text}"
        </Text>
        <Text style={{ color: '#9ca3af', marginTop: 10, fontSize: 16 }}>— {quote.author}</Text>
      </Animated.View>

      <View style={{ height: 40 }} />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity
          onPress={onStart}
          style={{ flex: 1, backgroundColor: '#22c55e', paddingVertical: 14, borderRadius: 14, alignItems: 'center' }}
        >
          <Text style={{ color: '#0b1220', fontWeight: '800' }}>{t('welcome.start')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={nextQuote}
          style={{ paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: '#1f2937' }}
        >
          <Text style={{ color: '#e5e7eb', fontWeight: '600' }}>{t('welcome.nextQuote')}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
      <Text style={{ color: '#9ca3af' }}>{t('welcome.autoClose')}</Text>
    </View>
  );
}
