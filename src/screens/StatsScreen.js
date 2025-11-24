import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Svg, Path, Defs, LinearGradient, Stop, Line, G, Text as SvgText } from 'react-native-svg';
import { useStore } from '../context/StoreContext';

// ───────────────────────────────────────────────────────────────────────────────
// Utils de fecha / claves
// ───────────────────────────────────────────────────────────────────────────────
const YMD = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const today = () => {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
};
const lastNDays = (n) => {
  const arr = [];
  const t = today();
  for (let i = n - 1; i >= 0; i--) arr.push(new Date(t.getFullYear(), t.getMonth(), t.getDate() - i));
  return arr;
};

// ───────────────────────────────────────────────────────────────────────────────
// Estilos base
// ───────────────────────────────────────────────────────────────────────────────
const CARD = { backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1f2937', padding: 16 };
const SCREEN_BG = { flex: 1, backgroundColor: '#0b1220' };

// ───────────────────────────────────────────────────────────────────────────────
// Grid de tarjetas responsivo (2 o 3 columnas)
// ───────────────────────────────────────────────────────────────────────────────
function StatGrid({ children, contentPadding = 16, gap = 12 }) {
  const { width } = useWindowDimensions();
  const cols = width < 380 ? 2 : 3;
  const cardW = (width - contentPadding * 2 - gap * (cols - 1));
  const itemW = cardW / cols;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { __width: itemW })
      )}
    </View>
  );
}

// Tarjeta compacta con título en 2 líneas y valor grande sin cortes
function StatCard({ title, value, accent = '#22c55e', __width = 120 }) {
  const small = __width < 125;
  const titleSize = small ? 11 : 12;
  const valueSize = small ? 22 : 28;

  return (
    <View style={[CARD, { width: __width, paddingVertical: 18 }]}>
      <Text
        style={{ color: '#cbd5e1', fontWeight: '600', fontSize: titleSize, lineHeight: titleSize + 4 }}
        numberOfLines={2}
        ellipsizeMode="tail"
        allowFontScaling={false}
      >
        {title}
      </Text>
      <Text
        style={{ color: accent, fontSize: valueSize, fontWeight: '900', marginTop: 6 }}
        numberOfLines={1}
        allowFontScaling={false}
      >
        {value}
      </Text>
    </View>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Gráfica de área (SVG) — 12 días
// ───────────────────────────────────────────────────────────────────────────────
function HabitAreaChart({ series /* 12 valores 0..100 */, title = 'Finalización del Hábito %' }) {
  // ViewBox fijo, se escala al ancho del contenedor
  const W = 340, H = 200, P = 28;
  const N = series.length;
  const xStep = (W - P * 2) / Math.max(1, N - 1);

  const points = series.map((v, i) => {
    const x = P + i * xStep;
    const y = P + (1 - v / 100) * (H - P * 2);
    return { x, y };
  });

  const lineD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  const areaD = `${lineD} L ${P + (N - 1) * xStep} ${H - P} L ${P} ${H - P} Z`;
  const grid = [0, 25, 50, 75, 100];

  return (
    <View style={[CARD]}>
      <Text style={{ color: '#e5e7eb', fontSize: 16, fontWeight: '700', marginBottom: 8 }}>{title}</Text>

      <Svg width="100%" height={220} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#fb923c" stopOpacity="0.45" />
            <Stop offset="100%" stopColor="#fb923c" stopOpacity="0.05" />
          </LinearGradient>
        </Defs>

        {/* Grid + labels Y */}
        <G>
          {grid.map((g) => {
            const y = P + (1 - g / 100) * (H - P * 2);
            return (
              <G key={g}>
                <Line x1={P} y1={y} x2={W - P} y2={y} stroke="#1f2937" strokeWidth="1" />
                <SvgText x={8} y={y + 4} fill="#94a3b8" fontSize="10">{`${g}%`}</SvgText>
              </G>
            );
          })}
        </G>

        {/* Área + línea */}
        <Path d={areaD} fill="url(#grad)" />
        <Path d={lineD} fill="none" stroke="#fb923c" strokeWidth="3" />

        {/* Eje X (1..12) */}
        {points.map((p, i) => (
          <SvgText key={i} x={p.x} y={H - 6} fill="#94a3b8" fontSize="10" textAnchor="middle">
            {i + 1}
          </SvgText>
        ))}
        <SvgText x={W / 2} y={H - 2} fill="#94a3b8" fontSize="10" textAnchor="middle">
          DÍAS
        </SvgText>
      </Svg>
    </View>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Mini-gráfica de barras (7 días) con Views (sin SVG extra)
// data: [{label, value}] (value entero)
// ───────────────────────────────────────────────────────────────────────────────
function Bars7Days({ data, title = 'Retos marcados (7 días)' }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <View style={[CARD]}>
      <Text style={{ color: '#e5e7eb', fontSize: 16, fontWeight: '700', marginBottom: 8 }}>{title}</Text>
      <View style={{ height: 140, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        {data.map((d, i) => {
          const h = (d.value / max) * 120;
          return (
            <View key={i} style={{ alignItems: 'center', width: 24 }}>
              <View style={{ height: h, width: 18, backgroundColor: '#38bdf8', borderTopLeftRadius: 8, borderTopRightRadius: 8 }} />
              <Text style={{ color: '#9ca3af', fontSize: 11, marginTop: 4 }}>{d.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const HISTORY_KEY = '@betterSelfApp:habitHistory'; // { [yyyy-mm-dd]: number 0..100 }

export default function StatsScreen() {
  const { routine, nightRoutine, tasks, habits, habitsDoneToday, challenges, streaks } = useStore();
  const [history, setHistory] = useState({}); // mapa fecha->% hábitos

  // Progresos de HOY (0..1)
  const routineP = useMemo(() => (routine.length ? routine.filter(r => r.done).length / routine.length : 0), [routine]);
  const nightP   = useMemo(() => (nightRoutine.length ? nightRoutine.filter(r => r.done).length / nightRoutine.length : 0), [nightRoutine]);
  const tasksP   = useMemo(() => (tasks.length ? tasks.filter(t => t.done).length / tasks.length : 0), [tasks]);
  const habitsP  = useMemo(() => {
    const total = habits.length || 0;
    const done = Object.values(habitsDoneToday || {}).filter(Boolean).length;
    return total ? done / total : 0;
  }, [habits, habitsDoneToday]);

  // Snapshot diario del % de hábitos
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(HISTORY_KEY);
        const map = raw ? JSON.parse(raw) : {};
        const key = YMD(today());
        const percent = Math.round(habitsP * 100);
        if (Number.isFinite(percent)) {
          if (map[key] !== percent) {
            map[key] = percent;
            await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(map));
          }
        }
        setHistory(map);
      } catch {}
    })();
  }, [habitsP]);

  // Serie 12 días (0..100)
  const days12 = lastNDays(12);
  const series12 = days12.map(d => Math.max(0, Math.min(100, Number((history[YMD(d)] ?? 0)))));

  // Retos 7 días
  const days7 = lastNDays(7);
  const retos7 = useMemo(() => {
    return days7.map(d => {
      const key = YMD(d);
      const count = (challenges || []).reduce((acc, c) => acc + (c.log?.[key] ? 1 : 0), 0);
      return { label: `${d.getDate()}/${d.getMonth()+1}`, value: count };
    });
  }, [challenges]);

  // Métricas para tarjetas
  const habHoy = `${Math.round(habitsP * 100)}%`;
  const rating = (() => {
    const arr = [routineP, habitsP, tasksP, nightP];
    const avg = arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
    return `${(avg * 5).toFixed(1)}/5`;
  })();
  const totalHabitos = String(habits.length);
  const retosActivos = String((challenges || []).filter(c => c.active).length);
  const retosHoy = (() => {
    const key = YMD(today());
    return String((challenges || []).reduce((acc, c) => acc + (c.log?.[key] ? 1 : 0), 0));
  })();
  const mejorRacha = (() => {
    if (!streaks || streaks.length === 0) return '0d';
    const t0 = today().getTime();
    const daysFrom = (iso) => {
      const [y, m, d] = (iso || YMD(today())).split('-').map(Number);
      const last = new Date(y, (m || 1) - 1, d || 1).getTime();
      return Math.max(0, Math.floor((t0 - last) / (24 * 60 * 60 * 1000)));
    };
    const best = Math.max(...streaks.map(s => daysFrom(s.lastResetISO)));
    return `${best}d`;
  })();

  return (
    <ScrollView style={SCREEN_BG} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={{ color: '#e5e7eb', fontSize: 22, fontWeight: '800' }}>Estadísticas</Text>

      {/* Tarjetas — grid responsivo sin textos cortados */}
      <StatGrid>
        <StatCard title="Finalización de hábitos" value={habHoy} accent="#fb923c" />
        <StatCard title="Calificación" value={rating} accent="#a78bfa" />
        <StatCard title="Hábitos totales" value={totalHabitos} accent="#22c55e" />
        <StatCard title="Retos activos" value={retosActivos} accent="#38bdf8" />
        <StatCard title="Retos marcados hoy" value={retosHoy} accent="#34d399" />
        <StatCard title="Mejor racha" value={mejorRacha} accent="#f59e0b" />
      </StatGrid>

      {/* Gráfica de área: hábitos (12 días) */}
      <HabitAreaChart series={series12} title="Finalización del Hábito % (12 días)" />

      {/* Barras: retos marcados (7 días) */}
      <Bars7Days data={retos7} title="Retos marcados (últimos 7 días)" />

      <View style={{ height: 16 }} />
    </ScrollView>
  );
}
