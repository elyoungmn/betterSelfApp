// src/context/StoreContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────
const todayKey = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const uid = (p = 'id') =>
  `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

// ───────────────────────────────────────────────────────────────────────────────
// Defaults (ajusta a tu gusto)
// ───────────────────────────────────────────────────────────────────────────────
const DEFAULT_MORNING = [
  { id: 'm-bed',        title: 'Hacer la cama',                 done: false },
  { id: 'm-water',      title: 'Hidratarse',                    done: false },
  { id: 'm-breathe',    title: 'Respiración 4-7-8 (1 ciclo)',   done: false },
  { id: 'm-tmi',        title: 'Ordenar',                done: false },
  { id: 'm-gratitude',  title: 'Gratitud',             done: false },
];

const DEFAULT_NIGHT = [
  { id: 'n-off',      title: 'Desconectar pantallas', done: false },
  { id: 'n-teeth',    title: 'Higiene dental',        done: false },
  { id: 'n-clothes',  title: 'Preparar ropa mañana',  done: false },
  { id: 'n-review',   title: 'Reflexión del día',     done: false },
];

const DEFAULT_HABITS = [
  { id: 'h-read',      title: 'Leer 15 minutos',          streak: 0, perDay: 1 },
  { id: 'h-exercise',  title: 'Ejercicio',                streak: 0, perDay: 1 },
  { id: 'h-breath',    title: 'Técnicas de respiración',  streak: 0, perDay: 1 },
  { id: 'h-social',    title: 'Socializar',               streak: 0, perDay: 1 },
  { id: 'h-water',     title: 'Hidratarse',               streak: 0, perDay: 2 },
  { id: 'h-outdoor',   title: 'Salir al aire libre',      streak: 0, perDay: 1 },
  { id: 'h-grat',      title: 'Gratitud',                 streak: 0, perDay: 2 },
];

// ───────────────────────────────────────────────────────────────────────────────
/** Storage keys */
// ───────────────────────────────────────────────────────────────────────────────
const K_LAST_RESET      = 'bs@lastResetDate';

const K_MORNING         = 'bs@morning';
const K_NIGHT           = 'bs@night';
const K_TASKS           = 'bs@tasks';

const K_HABITS          = 'bs@habits';
const K_HABITS_DONE_TOD = 'bs@habitsDoneToday';   // {id: boolean} compat
const K_HABITS_CNT_TOD  = 'bs@habitCountsToday';  // {id: number}

const K_TMI_PREFIX      = 'bs@tmi:'; // por día, ej: bs@tmi:2025-09-12

const K_CHALLENGE       = 'bs@challenge';   // reto del día (single)
const K_STREAKS         = 'bs@streaks_v1';  // lista de rachas
const K_CHALLENGES      = 'bs@challenges_v1'; // lista de retos múltiples

// ───────────────────────────────────────────────────────────────────────────────
// Contexto
// ───────────────────────────────────────────────────────────────────────────────
const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

// ───────────────────────────────────────────────────────────────────────────────
// Provider
// ───────────────────────────────────────────────────────────────────────────────
export function StoreProvider({ children }) {
  // Listas (persisten estructura + estado de "done" del día)
  const [routine, setRoutine] = useState(DEFAULT_MORNING);
  const [nightRoutine, setNightRoutine] = useState(DEFAULT_NIGHT);

  // Tareas diarias (persisten, pero su "done" se reinicia cada día)
  const [tasks, setTasks] = useState([]); // {id,title,done}

  // Hábitos
  const [habits, setHabits] = useState(DEFAULT_HABITS);
  const [habitsDoneToday, setHabitsDoneToday] = useState({});   // compat (bool)
  const [habitCountsToday, setHabitCountsToday] = useState({}); // nuevo (0..perDay)

  // Rachas (malos hábitos monitorizados)
  // Formato: { id, name, lastResetISO: 'YYYY-MM-DD' }
  const [streaks, setStreaks] = useState([]);

  // Retos múltiples
  // Formato: { id, name, targetDays, log: {'YYYY-MM-DD': true}, active, createdAt }
  const [challenges, setChallenges] = useState([]);

  // Otros
  const [challenge, setChallenge] = useState({ title: 'Caminar 20 min', done: false }); // reto del día (single)
  const [tmi, setTmi] = useState(''); // Tarea Más Importante de HOY

  const [lastResetDate, setLastResetDate] = useState(null);
  const today = useMemo(() => todayKey(), []);

  // ── Carga inicial
  useEffect(() => {
    (async () => {
      try {
        const [
          last, m, n, t,
          hs, hd, hc,
          ch,                   // reto del día
          streaksRaw,           // rachas
          challengesRaw,        // retos múltiples
        ] = await Promise.all([
          AsyncStorage.getItem(K_LAST_RESET),
          AsyncStorage.getItem(K_MORNING),
          AsyncStorage.getItem(K_NIGHT),
          AsyncStorage.getItem(K_TASKS),

          AsyncStorage.getItem(K_HABITS),
          AsyncStorage.getItem(K_HABITS_DONE_TOD),
          AsyncStorage.getItem(K_HABITS_CNT_TOD),

          AsyncStorage.getItem(K_CHALLENGE),
          AsyncStorage.getItem(K_STREAKS),
          AsyncStorage.getItem(K_CHALLENGES),
        ]);

        if (m) setRoutine(JSON.parse(m));
        if (n) setNightRoutine(JSON.parse(n));
        if (t) setTasks(JSON.parse(t));

        if (hs) setHabits(JSON.parse(hs));
        if (hd) setHabitsDoneToday(JSON.parse(hd));
        if (hc) setHabitCountsToday(JSON.parse(hc));

        if (ch) setChallenge(JSON.parse(ch)); // reto del día

        setStreaks(streaksRaw ? JSON.parse(streaksRaw) : []);
        setChallenges(challengesRaw ? JSON.parse(challengesRaw) : []);

        // TMI del día
        const tmiToday = await AsyncStorage.getItem(K_TMI_PREFIX + todayKey());
        if (tmiToday != null) setTmi(tmiToday);

        // Reset diario si cambió la fecha
        const lastStr = last || '';
        if (lastStr !== todayKey()) {
          resetDayState({ keepStructures: true });
        }
        setLastResetDate(todayKey());
      } catch (e) {
        console.warn('Store load error:', e?.message);
      }
    })();
  }, []);

  // ── Persistencia
  useEffect(() => { AsyncStorage.setItem(K_MORNING, JSON.stringify(routine)).catch(()=>{}); }, [routine]);
  useEffect(() => { AsyncStorage.setItem(K_NIGHT, JSON.stringify(nightRoutine)).catch(()=>{}); }, [nightRoutine]);
  useEffect(() => { AsyncStorage.setItem(K_TASKS, JSON.stringify(tasks)).catch(()=>{}); }, [tasks]);

  useEffect(() => { AsyncStorage.setItem(K_HABITS, JSON.stringify(habits)).catch(()=>{}); }, [habits]);
  useEffect(() => { AsyncStorage.setItem(K_HABITS_DONE_TOD, JSON.stringify(habitsDoneToday)).catch(()=>{}); }, [habitsDoneToday]);
  useEffect(() => { AsyncStorage.setItem(K_HABITS_CNT_TOD, JSON.stringify(habitCountsToday)).catch(()=>{}); }, [habitCountsToday]);

  useEffect(() => { AsyncStorage.setItem(K_STREAKS, JSON.stringify(streaks)).catch(()=>{}); }, [streaks]);
  useEffect(() => { AsyncStorage.setItem(K_CHALLENGES, JSON.stringify(challenges)).catch(()=>{}); }, [challenges]);

  useEffect(() => { AsyncStorage.setItem(K_CHALLENGE, JSON.stringify(challenge)).catch(()=>{}); }, [challenge]); // reto del día
  useEffect(() => { AsyncStorage.setItem(K_TMI_PREFIX + todayKey(), tmi || '').catch(()=>{}); }, [tmi]);
  useEffect(() => { AsyncStorage.setItem(K_LAST_RESET, lastResetDate || '').catch(()=>{}); }, [lastResetDate]);

  // ────────────────────────────────────────────────────────────────────────────
  // Reseteo de día (pone done=false y counts=0, pero conserva estructuras)
  // ────────────────────────────────────────────────────────────────────────────
  const resetDayState = ({ keepStructures = true } = {}) => {
    // Rutinas
    setRoutine(prev => prev.map(x => ({ ...x, done: false })));
    setNightRoutine(prev => prev.map(x => ({ ...x, done: false })));

    // Tareas: conserva lista pero pone done=false
    setTasks(prev => prev.map(t => ({ ...t, done: false })));

    // Hábitos: contadores y booleanos del día
    setHabitsDoneToday({});
    setHabitCountsToday({});
    setTmi('');

    setLastResetDate(todayKey());
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Rutina matutina / nocturna
  // ────────────────────────────────────────────────────────────────────────────
  const toggleRoutine = (id) => {
    setRoutine(prev => prev.map(x => x.id === id ? ({ ...x, done: !x.done }) : x));
  };
  const toggleNightRoutine = (id) => {
    setNightRoutine(prev => prev.map(x => x.id === id ? ({ ...x, done: !x.done }) : x));
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Tareas diarias
  // ────────────────────────────────────────────────────────────────────────────
  const addTask = (title) => setTasks(prev => [{ id: uid('t'), title, done: false }, ...prev]);
  const toggleTask = (id) => setTasks(prev => prev.map(t => t.id === id ? ({ ...t, done: !t.done }) : t));
  const removeTask = (id) => setTasks(prev => prev.filter(t => t.id !== id));

  // ────────────────────────────────────────────────────────────────────────────
  // Hábitos (multi-vez)
  // ────────────────────────────────────────────────────────────────────────────
  const addHabit = (title) => {
    const h = { id: uid('h'), title, streak: 0, perDay: 1 };
    setHabits(prev => [h, ...prev]);
  };

  const removeHabit = (id) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    setHabitsDoneToday(prev => {
      const c = { ...prev }; delete c[id]; return c;
    });
    setHabitCountsToday(prev => {
      const c = { ...prev }; delete c[id]; return c;
    });
  };

  // Compatibilidad: toggle todo el requisito del día (0 ⇄ perDay)
  const toggleHabitToday = (id) => {
    const per = habits.find(h => h.id === id)?.perDay ?? 1;
    setHabitCountsToday(prev => {
      const cur = prev[id] ?? (habitsDoneToday[id] ? per : 0);
      const next = cur >= per ? 0 : per;
      setHabitsDoneToday(b => ({ ...b, [id]: next >= per }));
      return { ...prev, [id]: next };
    });
  };

  // Incrementar / decrementar una vez
  const bumpHabitCount = (id, delta) => {
    const per = habits.find(h => h.id === id)?.perDay ?? 1;
    setHabitCountsToday(prev => {
      const base = prev[id] ?? (habitsDoneToday[id] ? per : 0);
      const next = Math.max(0, Math.min(per, (base || 0) + delta));
      setHabitsDoneToday(b => ({ ...b, [id]: next >= per }));
      return { ...prev, [id]: next };
    });
  };

  // Cambiar cuántas veces al día se requiere
  const setHabitPerDay = (id, perDay) => {
    const per = Math.max(1, Math.min(24, Math.floor(perDay || 1)));
    setHabits(prev => prev.map(h => (h.id === id ? { ...h, perDay: per } : h)));

    // Ajusta contador actual y booleano
    setHabitCountsToday(prev => {
      const val = Math.min(prev[id] ?? 0, per);
      setHabitsDoneToday(b => ({ ...b, [id]: val >= per }));
      return { ...prev, [id]: val };
    });
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Rachas (streaks)
// ────────────────────────────────────────────────────────────────────────────
  const addStreak = (name) => {
    const title = (name || '').trim();
    if (!title) return;
    const s = { id: uid('s'), name: title, lastResetISO: todayKey() };
    setStreaks(prev => [s, ...prev]);
  };

  const setStreakName = (id, name) => {
    const title = (name || '').trim();
    if (!title) return;
    setStreaks(prev => prev.map(s => (s.id === id ? { ...s, name: title } : s)));
  };

  // Marca "desliz" hoy -> resetea la racha a 0 (actualiza lastResetISO = hoy)
  const relapseStreak = (id) => {
    setStreaks(prev => prev.map(s => (s.id === id ? { ...s, lastResetISO: todayKey() } : s)));
  };

  const deleteStreak = (id) => {
    setStreaks(prev => prev.filter(s => s.id !== id));
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Retos múltiples (lista)
// ────────────────────────────────────────────────────────────────────────────
  const addChallenge = (name, targetDays) => {
    const title = (name || '').trim();
    const td = Number(targetDays) || 0;
    if (!title || td <= 0) return;

    const c = {
      id: uid('c'),
      name: title,
      targetDays: td,
      log: {},            // {'YYYY-MM-DD': true}
      active: true,
      createdAt: Date.now(),
    };
    setChallenges(prev => [c, ...prev]);
  };

  const renameChallenge = (id, name) => {
    const title = (name || '').trim();
    if (!title) return;
    setChallenges(prev => prev.map(c => (c.id === id ? { ...c, name: title } : c)));
  };

  const markChallengeToday = (id) => {
    const key = todayKey();
    setChallenges(prev =>
      prev.map(c => (c.id === id ? { ...c, log: { ...c.log, [key]: true } } : c))
    );
  };

  const cancelChallenge = (id) => {
    setChallenges(prev => prev.map(c => (c.id === id ? { ...c, active: false } : c)));
  };

  const deleteChallenge = (id) => {
    setChallenges(prev => prev.filter(c => c.id !== id));
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Challenge del día y TMI (single)
// ────────────────────────────────────────────────────────────────────────────
  const setChallengeDone = (done) =>
    setChallenge(prev => ({ ...prev, done: !!done }));

  // ────────────────────────────────────────────────────────────────────────────
  // Valor del contexto
  // ────────────────────────────────────────────────────────────────────────────
  const value = {
    // Rutinas
    routine,
    toggleRoutine,
    nightRoutine,
    toggleNightRoutine,

    // Tareas
    tasks,
    addTask,
    toggleTask,
    removeTask,

    // Hábitos
    habits,
    addHabit,
    removeHabit,
    habitsDoneToday,      // compat (bool)
    toggleHabitToday,     // compat (marca 0 ⇄ perDay)
    resetHabitsToDefault: () => {
      setHabits(DEFAULT_HABITS);
      setHabitsDoneToday({});
      setHabitCountsToday({});
    },

    // Multi-vez
    habitCountsToday,
    bumpHabitCount,
    setHabitPerDay,

    // Rachas
    streaks,
    addStreak,
    setStreakName,
    relapseStreak,
    deleteStreak,

    // Retos múltiples
    challenges,
    addChallenge,
    renameChallenge,
    markChallengeToday,
    cancelChallenge,
    deleteChallenge,

    // Reto del día (single)
    challenge,
    setChallengeDone,

    // TMI
    tmi,
    setTmi,

    // Utilidades
    resetDayState,
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}
