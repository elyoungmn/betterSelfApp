// src/screens/CoolDownScreen.js
import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';

import { View, Text, TouchableOpacity, Animated, Easing, useWindowDimensions, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

// ───────────────────────────────────────────────────────────────────────────────
// Presets de técnicas
// ───────────────────────────────────────────────────────────────────────────────
const COLORS = {
  inhale: '#22c55e',   // verde
  hold:   '#f59e0b',   // ámbar
  exhale: '#38bdf8',   // azul
  power:  '#a78bfa',   // violeta (resp. activa Wim Hof)
  empty:  '#ef4444',   // rojo (retención sin aire)
  recover:'#10b981',   // verde esmeralda (recuperación)
};

const makeTimedCycles = (pattern /* [{key,label,secs,color}] */, totalSecs) => {
  const seq = [];
  const cycleSecs = pattern.reduce((a,p)=>a+p.secs,0);
  if (cycleSecs <= 0) return [];
  let remaining = totalSecs;

  while (remaining > 0) {
    for (let i=0;i<pattern.length;i++) {
      const step = pattern[i];
      if (remaining <= 0) break;
      const secs = Math.min(step.secs, remaining);
      seq.push({ ...step, secs });
      remaining -= secs;
    }
  }
  return seq;
};

// ⚙️ Config por defecto para Wim Hof
const DEFAULT_WIM = { rounds: 3, breaths: 30, emptyHold: 60, recoverHold: 15 };
// Duraciones de respiración activa (fijas para simplicidad)
const WIM_POWER_IN = 2;  // ~2s in activa
const WIM_POWER_OUT = 1; // ~1s suelta pasiva

const PRESETS = {
  '478': {
    label: '4-7-8',
    timeBased: true,
    descLong: 'Inhala profundamente por 4s, sostén 7s y exhala 8s. Ideal para relajar el sistema nervioso y conciliar el sueño.',
    benefits: ['Reduce ansiedad', 'Induce calma', 'Mejora la calidad del sueño'],
    build: (minutes) => {
      const totalSecs = Math.max(60, Math.min(20*60, minutes*60));
      const pattern = [
        { key:'inhale', label:'Inhala', secs:4, color:COLORS.inhale },
        { key:'hold',   label:'Sostén', secs:7, color:COLORS.hold   },
        { key:'exhale', label:'Exhala', secs:8, color:COLORS.exhale },
      ];
      return makeTimedCycles(pattern, totalSecs);
    },
  },
  'box': {
    label: 'Box 4-4-4-4',
    timeBased: true,
    descLong: 'Respiración en “caja”: 4s inhalar, 4s sostener, 4s exhalar, 4s sostener. Equilibra y mejora el enfoque.',
    benefits: ['Enfoque mental', 'Estabilidad emocional', 'Ritmo respiratorio uniforme'],
    build: (minutes) => {
      const totalSecs = Math.max(60, Math.min(20*60, minutes*60));
      const pattern = [
        { key:'inhale', label:'Inhala', secs:4, color:COLORS.inhale },
        { key:'hold',   label:'Sostén', secs:4, color:COLORS.hold   },
        { key:'exhale', label:'Exhala', secs:4, color:COLORS.exhale },
        { key:'hold',   label:'Sostén', secs:4, color:COLORS.hold   },
      ];
      return makeTimedCycles(pattern, totalSecs);
    },
  },
  'coherent': {
    label: 'Coherente 5-5',
    timeBased: true,
    descLong: 'Respira a ~6 respiraciones por minuto: 5s inhalar, 5s exhalar. Favorece la variabilidad cardiaca óptima.',
    benefits: ['Coherencia cardiaca', 'Estrés bajo control', 'Mayor energía sostenida'],
    build: (minutes) => {
      const totalSecs = Math.max(60, Math.min(20*60, minutes*60));
      const pattern = [
        { key:'inhale', label:'Inhala', secs:5, color:COLORS.inhale },
        { key:'exhale', label:'Exhala', secs:5, color:COLORS.exhale },
      ];
      return makeTimedCycles(pattern, totalSecs);
    },
  },
  'wimhof': {
    label: 'Wim Hof',
    timeBased: false,
    descLong: 'Rondas de respiración activa con retenciones. Practícalo sentado o acostado.',
    benefits: ['Mayor control del estrés', 'Sensación de energía', 'Foco mental'],
    // build acepta config dinámica
    build: (_minutes, config = DEFAULT_WIM) => {
      const { rounds, breaths, emptyHold, recoverHold } = config;
      const seq = [];
      for (let r=1; r<=rounds; r++) {
        for (let i=0;i<breaths;i++) {
          seq.push({ key:'inhale', label:`Respira ${i+1}/${breaths}`, secs: WIM_POWER_IN,  color: COLORS.power });
          seq.push({ key:'exhale', label:'Suelta',                 secs: WIM_POWER_OUT, color: COLORS.exhale });
        }
        seq.push({ key:'hold', label:'Retén (sin aire)',         secs: emptyHold,   color: COLORS.empty });
        seq.push({ key:'hold', label:'Recuperación (retén)',     secs: recoverHold, color: COLORS.recover });
      }
      return seq;
    },
  },
};

const PREF_MINUTES      = '@cooldown:minutes';
const PREF_PROTOCOL     = '@cooldown:protocol';
const PREF_WIM_ROUNDS   = '@cooldown:wim_rounds';
const PREF_WIM_BREATHS  = '@cooldown:wim_breaths';
const PREF_WIM_EMPTY    = '@cooldown:wim_empty';
const PREF_WIM_RECOVER  = '@cooldown:wim_recover';

// ───────────────────────────────────────────────────────────────────────────────
// Componente
// ───────────────────────────────────────────────────────────────────────────────
export default function CoolDownScreen() {
  const { width } = useWindowDimensions();
  const CONTENT_PADDING = 16;
  const CARDS_GAP = 12;
  const CARD_WIDTH = (width - CONTENT_PADDING*2 - CARDS_GAP) / 2; // 2 por fila

  // Estado básico
  const [protocol, setProtocol] = useState('478');
  const [minutes, setMinutes] = useState(2);

  // ⚙️ Config Wim Hof
  const [wim, setWim] = useState(DEFAULT_WIM);

  // Estado de ejecución
  const [running, setRunning] = useState(false);
  const [seq, setSeq] = useState([]);           // pasos {label,secs,color,key}
  const [idx, setIdx] = useState(0);
  const [stepLeft, setStepLeft] = useState(0);
  const [totalLeft, setTotalLeft] = useState(0);

  // Animación
  const scale = useRef(new Animated.Value(1)).current;
  const tickRef = useRef(null);

  // Cargar preferencias
  useEffect(() => {
    (async () => {
      try {
        const [m, p, wr, wb, we, wrc] = await Promise.all([
          AsyncStorage.getItem(PREF_MINUTES),
          AsyncStorage.getItem(PREF_PROTOCOL),
          AsyncStorage.getItem(PREF_WIM_ROUNDS),
          AsyncStorage.getItem(PREF_WIM_BREATHS),
          AsyncStorage.getItem(PREF_WIM_EMPTY),
          AsyncStorage.getItem(PREF_WIM_RECOVER),
        ]);
        if (m) setMinutes(Math.max(1, Math.min(20, parseInt(m,10) || 2)));
        if (p && PRESETS[p]) setProtocol(p);
        setWim({
          rounds:      clampInt(wr, DEFAULT_WIM.rounds, 1, 5),
          breaths:     clampInt(wb, DEFAULT_WIM.breaths, 20, 60),
          emptyHold:   clampInt(we, DEFAULT_WIM.emptyHold, 20, 180),
          recoverHold: clampInt(wrc, DEFAULT_WIM.recoverHold, 10, 40),
        });
      } catch {}
    })();
  }, []);

  // Guardar preferencias
  useEffect(() => { AsyncStorage.setItem(PREF_MINUTES, String(minutes)).catch(()=>{}); }, [minutes]);
  useEffect(() => { AsyncStorage.setItem(PREF_PROTOCOL, String(protocol)).catch(()=>{}); }, [protocol]);
  useEffect(() => {
    AsyncStorage.multiSet([
      [PREF_WIM_ROUNDS,   String(wim.rounds)],
      [PREF_WIM_BREATHS,  String(wim.breaths)],
      [PREF_WIM_EMPTY,    String(wim.emptyHold)],
      [PREF_WIM_RECOVER,  String(wim.recoverHold)],
    ]).catch(()=>{});
  }, [wim.rounds, wim.breaths, wim.emptyHold, wim.recoverHold]);

  const currentStep = seq[idx] || null;
  const isTimeBased = PRESETS[protocol]?.timeBased;

  const totalPlanned = useMemo(
    () => seq.reduce((a,s)=>a+(s.secs||0),0),
    [seq]
  );

  // Plan estimado (antes de iniciar)
  const plannedTime = useMemo(() => {
    if (PRESETS[protocol]?.timeBased) return Math.max(60, Math.min(20*60, minutes*60));
    // Wim Hof
    const perBreath = WIM_POWER_IN + WIM_POWER_OUT;
    const perRound  = (wim.breaths * perBreath) + wim.emptyHold + wim.recoverHold;
    return wim.rounds * perRound;
  }, [protocol, minutes, wim]);

  // Animación por tipo de fase
  const animateForKey = (key, secs=1) => {
    if (key === 'inhale') {
      Animated.timing(scale, { toValue: 1.2, duration: secs*1000, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    } else if (key === 'hold') {
      Animated.timing(scale, { toValue: 1.2, duration: 200, useNativeDriver: true }).start();
    } else { // exhale / otros
      Animated.timing(scale, { toValue: 0.9, duration: secs*1000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start();
    }
  };

  const stop = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    setRunning(false);
    setIdx(0);
    setStepLeft(0);
    setTotalLeft(0);
    Animated.timing(scale, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  };

  const startSequence = () => {
    const preset = PRESETS[protocol];
    if (!preset) return;

    // Construir la secuencia (Wim usa config)
    const sequence = preset.timeBased ? preset.build(minutes) : preset.build(undefined, wim);
    if (!sequence.length) return;

    setSeq(sequence);
    setIdx(0);
    setStepLeft(sequence[0].secs);
    setTotalLeft(sequence.reduce((a,s)=>a+s.secs,0));
    setRunning(true);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{});
    animateForKey(sequence[0].key, sequence[0].secs);

    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setStepLeft((s) => {
        if (s > 1) return s - 1;
        // Cambia de paso
        setIdx((i) => {
          const next = i + 1;
          if (next >= sequence.length) {
            clearInterval(tickRef.current);
            tickRef.current = null;
            setRunning(false);
            Animated.timing(scale, { toValue: 1, duration: 250, useNativeDriver: true }).start();
            return i;
          } else {
            const st = sequence[next];
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{});
            animateForKey(st.key, st.secs);
            setStepLeft(st.secs);
            return next;
          }
        });
        return 0;
      });
      setTotalLeft((t) => Math.max(0, t - 1));
    }, 1000);
  };

  useEffect(() => () => { if (tickRef.current) clearInterval(tickRef.current); }, []);

  const onPresetPress = (k) => {
    if (running) return; // no cambiar durante ejecución
    setProtocol(k);      // solo seleccionar (NO iniciar)
  };

  const incMinutes = (d) => {
    if (running) return;
    setMinutes((m) => Math.max(1, Math.min(20, m + d)));
  };

  const stepColor = currentStep?.color || '#1f2937';

  // Formateo reloj
  const fmt = (s) => {
    const m = Math.floor(s/60), ss = s%60;
    return `${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
  };

  // ────────────────────────────────────────────────────────────────────────────
  // UI (con ScrollView para permitir desplazamiento)
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <ScrollView style={{ flex:1, backgroundColor:'#0b1220' }} contentContainerStyle={{ padding: CONTENT_PADDING, paddingBottom: 28 }}>
      <Text style={{ color:'#e5e7eb', fontSize:22, fontWeight:'800', marginBottom:8 }}>
        Respiración guiada
      </Text>
      <Text style={{ color:'#9ca3af', marginBottom:12 }}>
        Elige la técnica. Ajusta parámetros si aplica y cuando estés listo, presiona <Text style={{ color:'#e5e7eb', fontWeight:'700' }}>Iniciar</Text>.
      </Text>

      {/* Tarjetas de presets — 2 por fila, grandes y uniformes, solo nombre */}
      <View style={{ flexDirection:'row', flexWrap:'wrap', gap: CARDS_GAP, marginBottom: 16 }}>
        {(['478','box','coherent','wimhof']).map((k) => {
          const p = PRESETS[k];
          const active = k === protocol;
          return (
            <TouchableOpacity
              key={k}
              onPress={() => onPresetPress(k)}
              disabled={running}
              style={{
                width: CARD_WIDTH,
                minHeight: 96,
                backgroundColor: active ? '#16a34a' : '#0f172a',
                borderColor: '#1f2937',
                borderWidth: 1,
                borderRadius: 16,
                paddingVertical: 18,
                paddingHorizontal: 12,
                opacity: running ? 0.8 : 1,
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Text
                style={{ color: active ? '#0b1220' : '#e5e7eb', fontSize: 16, fontWeight: '900' }}
                numberOfLines={1}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Controles de duración (solo para técnicas por tiempo) */}
      {PRESETS[protocol]?.timeBased && (
        <View style={{
          backgroundColor:'#0f172a', borderRadius:16, borderWidth:1, borderColor:'#1f2937',
          padding:16, flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom: 16
        }}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
            <Text style={{ color:'#cbd5e1', fontWeight:'700' }}>Duración</Text>
            <TouchableOpacity onPress={() => incMinutes(-1)} disabled={running} style={BTN(running)}><Text style={BTNTXT}>–</Text></TouchableOpacity>
            <View style={{ minWidth:56, alignItems:'center' }}>
              <Text style={{ color:'#e5e7eb', fontSize:20, fontWeight:'900' }}>{minutes} min</Text>
            </View>
            <TouchableOpacity onPress={() => incMinutes(1)} disabled={running} style={BTN(running)}><Text style={BTNTXT}>+</Text></TouchableOpacity>
          </View>
          <Text style={{ color:'#9ca3af' }}>Planificado: {fmt(plannedTime)}</Text>
        </View>
      )}

      {/* Configuración Wim Hof (solo visible cuando está seleccionada) */}
      {protocol === 'wimhof' && (
        <View style={{ backgroundColor:'#0f172a', borderRadius:16, borderWidth:1, borderColor:'#1f2937', padding:16, marginBottom: 16, gap:12 }}>
          <Text style={{ color:'#e5e7eb', fontSize:16, fontWeight:'800' }}>Wim Hof — Configuración</Text>

          <ConfigRow
            label="Rondas"
            value={wim.rounds}
            onDec={() => !running && setWim(v => ({ ...v, rounds: Math.max(1, v.rounds - 1) }))}
            onInc={() => !running && setWim(v => ({ ...v, rounds: Math.min(5, v.rounds + 1) }))}
          />
          <ConfigRow
            label="Respiraciones por ronda"
            value={wim.breaths}
            onDec={() => !running && setWim(v => ({ ...v, breaths: Math.max(20, v.breaths - 1) }))}
            onInc={() => !running && setWim(v => ({ ...v, breaths: Math.min(60, v.breaths + 1) }))}
          />
          <ConfigRow
            label="Retención sin aire (s)"
            value={wim.emptyHold}
            onDec={() => !running && setWim(v => ({ ...v, emptyHold: Math.max(20, v.emptyHold - 5) }))}
            onInc={() => !running && setWim(v => ({ ...v, emptyHold: Math.min(180, v.emptyHold + 5) }))}
            stepNote="±5s"
          />
          <ConfigRow
            label="Recuperación (retén) (s)"
            value={wim.recoverHold}
            onDec={() => !running && setWim(v => ({ ...v, recoverHold: Math.max(10, v.recoverHold - 1) }))}
            onInc={() => !running && setWim(v => ({ ...v, recoverHold: Math.min(40, v.recoverHold + 1) }))}
          />

          <Text style={{ color:'#9ca3af' }}>
            Estimado: {fmt(plannedTime)} totales. Practica en un lugar seguro y detente si hay mareo.
          </Text>
        </View>
      )}

      {/* Descripción + beneficios de la técnica seleccionada */}
      <View style={{ backgroundColor:'#0f172a', borderRadius:16, borderWidth:1, borderColor:'#1f2937', padding:16, marginBottom: 16 }}>
        <Text style={{ color:'#e5e7eb', fontSize:16, fontWeight:'800', marginBottom:6 }}>
          {PRESETS[protocol].label}
        </Text>
        <Text style={{ color:'#9ca3af', marginBottom:8 }}>
          {PRESETS[protocol].descLong}
        </Text>
        <Text style={{ color:'#cbd5e1', fontWeight:'700', marginBottom:6 }}>Beneficios</Text>
        <View style={{ gap:4 }}>
          {PRESETS[protocol].benefits.map((b, i) => (
            <Text key={i} style={{ color:'#9ca3af' }}>• {b}</Text>
          ))}
        </View>
      </View>

      {/* Círculo animado + cronómetro */}
      <View style={{ alignItems:'center', justifyContent:'center', marginTop:6, marginBottom:10 }}>
        <Animated.View style={{
          width: 240, height: 240, borderRadius:9999, alignItems:'center', justifyContent:'center',
          backgroundColor: (currentStep?.color || '#1f2937') + '22',
          borderWidth: 2, borderColor: currentStep?.color || '#1f2937',
          transform: [{ scale }]
        }}>
          <Text style={{ color:'#e5e7eb', fontSize:26, fontWeight:'900' }}>
            {currentStep?.label || PRESETS[protocol]?.label}
          </Text>
          {running ? (
            <Text style={{ color: currentStep?.color || '#9ca3af', fontSize:18, marginTop:6, fontVariant:['tabular-nums'] }}>
              {String(stepLeft).padStart(2,'0')}s
            </Text>
          ) : (
            <Text style={{ color:'#9ca3af', marginTop:6 }}>Listo cuando tú lo estés</Text>
          )}
        </Animated.View>

        {/* Cronómetro total */}
        <Text style={{ color:'#cbd5e1', fontSize:18, marginTop:12, fontVariant:['tabular-nums'] }}>
          {fmt(totalLeft || plannedTime)}
        </Text>
      </View>

      {/* Botones principales */}
      <View style={{ flexDirection:'row', justifyContent:'center', gap:12 }}>
        {!running ? (
          <TouchableOpacity onPress={startSequence} style={PRIMARY_BTN}>
            <Text style={PRIMARY_TXT}>Iniciar {PRESETS[protocol]?.label}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={stop} style={STOP_BTN}>
            <Text style={STOP_TXT}>Detener</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ height:18 }} />

      {/* Tips / seguridad */}
      <View style={CARD}>
        <Text style={{ color:'#e5e7eb', fontWeight:'700', marginBottom:6 }}>Notas</Text>
        <Text style={{ color:'#9ca3af' }}>
          Practica en un lugar seguro, sentado o acostado. Si sientes mareo, detente. 
          Evita hacerlo al conducir, de pie, o en agua. La técnica Wim Hof incluye retenciones prolongadas; 
          consulta a un profesional si tienes condiciones respiratorias o cardiovasculares.
        </Text>
      </View>
    </ScrollView>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Subcomponentes y utilidades
// ───────────────────────────────────────────────────────────────────────────────
function ConfigRow({ label, value, onDec, onInc, stepNote }) {
  return (
    <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
      <Text style={{ color:'#cbd5e1', fontWeight:'700' }}>{label}</Text>
      <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
        <TouchableOpacity onPress={onDec} style={BTN(false)}><Text style={BTNTXT}>–</Text></TouchableOpacity>
        <View style={{ minWidth:56, alignItems:'center' }}>
          <Text style={{ color:'#e5e7eb', fontSize:18, fontWeight:'900' }}>{value}</Text>
        </View>
        <TouchableOpacity onPress={onInc} style={BTN(false)}><Text style={BTNTXT}>+</Text></TouchableOpacity>
        {!!stepNote && <Text style={{ color:'#64748b', fontSize:12 }}>{stepNote}</Text>}
      </View>
    </View>
  );
}

const clampInt = (maybe, fallback, min, max) => {
  const n = parseInt(maybe ?? '', 10);
  if (Number.isFinite(n)) return Math.max(min, Math.min(max, n));
  return fallback;
};

// ───────────────────────────────────────────────────────────────────────────────
// Estilos base
// ───────────────────────────────────────────────────────────────────────────────
const CARD = { backgroundColor:'#0f172a', borderRadius:16, borderWidth:1, borderColor:'#1f2937', padding:16 };
const PRIMARY_BTN = { backgroundColor:'#22c55e', paddingVertical:14, paddingHorizontal:28, borderRadius:14 };
const PRIMARY_TXT = { color:'#0b1220', fontWeight:'900', fontSize:16 };
const STOP_BTN = { backgroundColor:'#ef4444', paddingVertical:14, paddingHorizontal:28, borderRadius:14 };
const STOP_TXT = { color:'#fff', fontWeight:'900', fontSize:16 };
const BTN = () => ({
  width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937'
});
const BTNTXT = { color:'#e5e7eb', fontSize:18, fontWeight:'800', marginTop:-2 };
