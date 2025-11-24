import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';

const TOTAL_SECONDS = 120; // 2 minutos
const DUR_INHALE = 4;
const DUR_HOLD = 7;
const DUR_EXHALE = 8;

export default function CoolDown() {
  const [phase, setPhase] = useState('IDLE'); // IDLE | INHALE | HOLD | EXHALE | DONE
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS); // en segundos

  const endAtRef = useRef(null);
  const tickerRef = useRef(null);

  // animación de tamaño del círculo
  const scale = useRef(new Animated.Value(1)).current;

  const stopAll = useCallback(() => {
    setRunning(false);
    scale.stopAnimation();
    if (tickerRef.current) {
      clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
  }, [scale]);

  const reset = useCallback(() => {
    stopAll();
    setPhase('IDLE');
    setTimeLeft(TOTAL_SECONDS);
    scale.setValue(1);
    endAtRef.current = null;
  }, [stopAll, scale]);

  const startTicker = useCallback(() => {
    if (tickerRef.current) return;
    tickerRef.current = setInterval(() => {
      if (!endAtRef.current) return;
      const remaining = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(tickerRef.current);
        tickerRef.current = null;
        setPhase('DONE');
        setRunning(false);
      }
    }, 250);
  }, []);

  // Utilidad para animar con Promesa
  const animateTo = useCallback((val, ms) => {
    return new Promise(resolve => {
      Animated.timing(scale, {
        toValue: val,
        duration: ms,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => resolve());
    });
  }, [scale]);

  const waitMs = useCallback((ms) => new Promise(res => setTimeout(res, ms)), []);

  const runPhases = useCallback(async () => {
    // bucle hasta agotar los 2 minutos o hasta pausar
    while (running && timeLeft > 0) {
      // INHALE
      setPhase('INHALE');
      await animateTo(1.35, Math.min(DUR_INHALE * 1000, Math.max(0, endAtRef.current - Date.now())));
      if (!running || timeLeft <= 0) break;

      // HOLD
      setPhase('HOLD');
      await waitMs(Math.min(DUR_HOLD * 1000, Math.max(0, endAtRef.current - Date.now())));
      if (!running || timeLeft <= 0) break;

      // EXHALE
      setPhase('EXHALE');
      await animateTo(0.85, Math.min(DUR_EXHALE * 1000, Math.max(0, endAtRef.current - Date.now())));
      if (!running || timeLeft <= 0) break;

      // volver a centro por estética
      await animateTo(1.0, 250);
    }
    if (timeLeft <= 0) {
      setPhase('DONE');
      setRunning(false);
    }
  }, [animateTo, waitMs, running, timeLeft]);

  const onStartPause = useCallback(() => {
    if (running) {
      // Pausar
      stopAll();
      return;
    }
    // Reanudar / Iniciar
    setRunning(true);
    if (!endAtRef.current) {
      endAtRef.current = Date.now() + timeLeft * 1000;
    } else {
      // ya había un fin programado; simplemente continuamos
      endAtRef.current = Date.now() + timeLeft * 1000;
    }
    if (phase === 'IDLE' || phase === 'DONE') setPhase('INHALE');
    startTicker();
    // Correr fases en background (no bloquear UI)
    setTimeout(() => runPhases(), 0);
  }, [running, stopAll, timeLeft, phase, startTicker, runPhases]);

  useEffect(() => () => stopAll(), [stopAll]);

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');

  // color por fase
  const circleColor =
    phase === 'INHALE' ? '#22c55e' :       // verde
    phase === 'HOLD'   ? '#f59e0b' :       // ámbar
    phase === 'EXHALE' ? '#60a5fa' :       // azul
    '#334155';                              // gris (idle/done)

  const phaseText =
    phase === 'INHALE' ? 'Inhala (4s)' :
    phase === 'HOLD'   ? 'Sostén (7s)' :
    phase === 'EXHALE' ? 'Exhala (8s)' :
    phase === 'DONE'   ? '¡Completado!' :
    'Listo para comenzar';

  return (
    <View style={card}>
      <Text style={title}>CoolDown — Respiración 4-7-8 (2 min)</Text>
      <Text style={hint}>Sigue el círculo: inhala, sostén y exhala con el ritmo.</Text>

      <View style={{ alignItems: 'center', marginVertical: 16 }}>
        <Animated.View
          style={[
            circle,
            {
              transform: [{ scale }],
              borderColor: circleColor,
              shadowColor: circleColor,
            }
          ]}
        />
      </View>

      <Text style={phaseLabel}>{phaseText}</Text>
      <Text style={timer}>{mm}:{ss}</Text>

      <View style={row}>
        <TouchableOpacity onPress={onStartPause} style={[btn, { backgroundColor: running ? '#ef4444' : '#22c55e' }]}>
          <Text style={btnText}>{running ? 'Pausar' : 'Iniciar'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={reset} style={[btn, { backgroundColor: '#334155' }]}>
          <Text style={btnText}>Reiniciar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const card = { backgroundColor:'#0f172a', borderRadius:16, borderWidth:1, borderColor:'#1f2937', padding:16, marginBottom:16 };
const title = { color:'#e5e7eb', fontSize:16, fontWeight:'600', marginBottom:8 };
const hint = { color:'#9ca3af' };
const circle = {
  width: 180, height: 180, borderRadius: 100,
  borderWidth: 4, backgroundColor: 'transparent',
  shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }
};
const phaseLabel = { color:'#e5e7eb', textAlign:'center', fontSize:16, marginTop: 4 };
const timer = { color:'#e5e7eb', textAlign:'center', fontSize:28, fontWeight:'700', marginVertical: 8, letterSpacing: 1 };
const row = { flexDirection:'row', gap:12, marginTop:8 };
const btn = { flex:1, paddingVertical:12, borderRadius:12, alignItems:'center' };
const btnText = { color:'#0b1220', fontWeight:'bold' };
