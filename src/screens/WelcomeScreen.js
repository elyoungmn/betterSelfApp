import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';

import { View, Text, TouchableOpacity, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const QUOTES = [
  { text: 'No es lo que te sucede, sino cómo reaccionas a ello lo que importa.', author: 'Epicteto' },
  { text: 'La felicidad de tu vida depende de la calidad de tus pensamientos.', author: 'Marco Aurelio' },
  { text: 'La mayor victoria es vencerse a uno mismo.', author: 'Séneca' },
  { text: 'Si te molesta algo externo, el dolor no se debe a la cosa en sí, sino a tu evaluación.', author: 'Marco Aurelio' },
  { text: 'Nadie es libre si no es dueño de sí mismo.', author: 'Epicteto' },
  { text: 'La dificultad muestra lo que somos.', author: 'Epicteto' },
  { text: 'A quien tiene un porqué, casi cualquier cómo le resulta soportable.', author: 'Nietzsche' },
];

// índice determinístico por día (local)
const getDailyIndex = () => {
  const dayNumber = Math.floor(new Date().setHours(0, 0, 0, 0) / 86_400_000);
  return dayNumber % QUOTES.length;
};

export default function WelcomeScreen() {
  const nav = useNavigation();
  const [idx, setIdx] = useState(getDailyIndex);

  // animaciones
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.98)).current;

  // timer auto-cierre 7s
  const autoTimerRef = useRef(null);

  const quote = useMemo(() => QUOTES[idx], [idx]);

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
        setIdx(getDailyIndex());
        scheduleMidnightTick();
      }, next.getTime() - now.getTime());
    };
    scheduleMidnightTick();
    return () => clearTimeout(t);
  }, []);

  const nextQuote = () => {
    Animated.sequence([
      Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
    setIdx(v => (v + 1) % QUOTES.length);
  };

  const onStart = async () => {
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    await AsyncStorage.setItem('welcome_seen', '1');
    nav.reset({ index: 0, routes: [{ name: 'Root' }] });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0b1220', padding: 24, justifyContent: 'center' }}>
      <Text style={{ color: '#22c55e', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>bienvenido</Text>
      <Text style={{ color: '#e5e7eb', fontSize: 28, fontWeight: '800', marginBottom: 24 }}>Empieza con claridad 🧠</Text>

      <Animated.View style={{ opacity: fade, transform: [{ scale }] }}>
        <Text style={{ color: '#e5e7eb', fontSize: 20, lineHeight: 30, fontStyle: 'italic' }}>
          “{quote.text}”
        </Text>
        <Text style={{ color: '#9ca3af', marginTop: 10, fontSize: 16 }}>— {quote.author}</Text>
      </Animated.View>

      <View style={{ height: 40 }} />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity
          onPress={onStart}
          style={{ flex: 1, backgroundColor: '#22c55e', paddingVertical: 14, borderRadius: 14, alignItems: 'center' }}
        >
          <Text style={{ color: '#0b1220', fontWeight: '800' }}>Comenzar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={nextQuote}
          style={{ paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: '#1f2937' }}
        >
          <Text style={{ color: '#e5e7eb', fontWeight: '600' }}>Otra frase</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
      <Text style={{ color: '#9ca3af' }}>La frase cambia automáticamente cada día. Esta pantalla se cierra sola en 7 segundos.</Text>
    </View>
  );
}
