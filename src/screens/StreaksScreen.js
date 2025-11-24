// src/screens/StreaksScreen.js
import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useStore } from '../context/StoreContext';
import EditModal from '../components/EditModal';
import ProgressBar from '../components/ProgressBar';

// --- utilidades locales ---
const getToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};
const parseISO = (iso) => {
  if (!iso) return getToday();
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const daysBetweenUTC = (a, b) => {
  const MS = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.floor((a.getTime() - b.getTime()) / MS));
};
const formatYMD = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

export default function StreaksScreen() {
  const {
    // rachas (malos hábitos)
    streaks, setStreakName, relapseStreak, addStreak, deleteStreak,
    // retos múltiples
    challenges, addChallenge, renameChallenge, markChallengeToday, cancelChallenge, deleteChallenge,
  } = useStore();

  // ---- estado local UI ----
  const [newStreak, setNewStreak] = useState('');
  const [newName, setNewName] = useState('');
  const [target, setTarget] = useState('7');
  const [edit, setEdit] = useState(null); // { id, name, kind: 'streak'|'challenge' }

  // ---- derivados ----
  const streakInfo = useMemo(() => {
    const today = getToday();
    return (streaks || []).map(s => {
      const last = parseISO(s.lastResetISO);
      return { ...s, days: daysBetweenUTC(today, last) };
    });
  }, [streaks]);

  const todayKey = formatYMD(getToday());
  const challengeInfo = useMemo(() => {
    return (challenges || []).map(c => {
      const done = Object.keys(c.log || {}).length;
      const left = Math.max(0, (c.targetDays || 0) - done);
      const progress = c.targetDays > 0 ? Math.min(1, done / c.targetDays) : 0;
      const markedToday = !!(c.log || {})[todayKey];
      const completed = done >= (c.targetDays || 0);
      return { ...c, done, left, progress, markedToday, completed };
    });
  }, [challenges, todayKey]);

  // ---- handlers ----
  const quickPick = (n) => setTarget(String(n));

  const onAddChallenge = () => {
    const n = (newName || '').trim();
    const td = Number(target);
    if (!n || !Number.isFinite(td) || td <= 0) return;
    addChallenge(n, td);
    setNewName('');
    setTarget('7');
  };

  const onAddStreak = () => {
    const n = (newStreak || '').trim();
    if (!n) return;
    addStreak(n);
    setNewStreak('');
  };

  // ---- render ----
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0b1220' }} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={{ color: '#e5e7eb', fontSize: 22, fontWeight: '800' }}>Rachas</Text>

      {/* Monitores de racha */}
      <View style={card}>
        <Text style={title}>Monitores (malos hábitos)</Text>
        <Text style={hint}>Cuenta cuántos días llevas sin un hábito que quieres dejar.</Text>

        {/* ➕ Crear monitor */}
        <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={newStreak}
            onChangeText={setNewStreak}
            placeholder="Ej: Sin pornografía"
            placeholderTextColor="#6b7280"
            style={[input, { flex: 1 }]}
          />
          <TouchableOpacity onPress={onAddStreak} style={[btn, { backgroundColor: '#22c55e' }]}>
            <Text style={btnTxtDark}>Agregar</Text>
          </TouchableOpacity>
        </View>

        {/* Lista */}
        {streakInfo.map(s => (
          <View key={s.id} style={[itemCard, { marginTop: 12 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#e5e7eb', fontSize: 16, fontWeight: '700' }}>{s.name}</Text>
              <Text style={{ color: '#9ca3af' }}>
                Días “limpio”: <Text style={{ color: '#22c55e', fontWeight: '800' }}>{s.days}</Text>
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <TouchableOpacity onPress={() => setEdit({ id: s.id, name: s.name, kind: 'streak' })} style={chip}>
                <Text style={{ color: '#e5e7eb' }}>Renombrar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => relapseStreak(s.id)} style={[chip, { borderColor: '#ef4444' }]}>
                <Text style={{ color: '#ef4444' }}>Desliz hoy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteStreak(s.id)} style={[chip, { borderColor: '#f59e0b' }]}>
                <Text style={{ color: '#f59e0b' }}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {(!streakInfo || streakInfo.length === 0) && (
          <Text style={{ color: '#9ca3af', marginTop: 12 }}>No hay monitores aún. Crea uno arriba.</Text>
        )}
      </View>

      {/* Retos múltiples */}
      <View style={card}>
        <Text style={title}>Retos</Text>
        <Text style={hint}>Crea varios retos (Ayuno, Ejercicio, Ducha fría, etc.). Marca un día por reto.</Text>

        {/* Crear reto */}
        <View style={{ marginTop: 12, gap: 10 }}>
          <Text style={{ color: '#e5e7eb' }}>Nombre del reto</Text>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="Ej: Ayuno"
            placeholderTextColor="#6b7280"
            style={input}
          />
          <Text style={{ color: '#e5e7eb' }}>Días objetivo</Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {[7, 14, 21].map(n => (
              <TouchableOpacity key={n} onPress={() => quickPick(n)} style={[chip, target === String(n) && chipOn]}>
                <Text style={{ color: target === String(n) ? '#0b1220' : '#e5e7eb' }}>{n}</Text>
              </TouchableOpacity>
            ))}
            <TextInput
              value={target}
              onChangeText={setTarget}
              keyboardType="number-pad"
              placeholder="Días"
              placeholderTextColor="#6b7280"
              style={[input, { width: 100, textAlign: 'center' }]}
            />
            <TouchableOpacity onPress={onAddChallenge} style={[btn, { backgroundColor: '#22c55e' }]}>
              <Text style={btnTxtDark}>Crear</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lista de retos */}
        <View style={{ marginTop: 16, gap: 12 }}>
          {challengeInfo.map(c => (
            <View key={c.id} style={itemCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#e5e7eb', fontSize: 16, fontWeight: '700' }}>
                  {c.name} {c.completed ? '🎉' : ''}
                </Text>
                {!c.active && <Text style={{ color: '#9ca3af', fontSize: 12 }}>(inactivo)</Text>}
              </View>

              <ProgressBar progress={c.progress} />

              <Text style={{ color: '#9ca3af', marginTop: 6 }}>
                {c.done}/{c.targetDays} completados — Restan <Text style={{ color: '#e5e7eb' }}>{c.left}</Text>
              </Text>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() => markChallengeToday(c.id)}
                  style={[btn, { backgroundColor: '#22c55e', flex: 1 }]}
                  disabled={c.markedToday || c.completed || !c.active}
                >
                  <Text style={btnTxtDark}>
                    {c.completed ? 'Reto completado' : c.markedToday ? 'Hoy ya marcado' : 'Marcar hoy'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => cancelChallenge(c.id)} style={[btn, { backgroundColor: '#334155' }]}>
                  <Text style={btnTxt}>Finalizar / Cancelar</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity onPress={() => setEdit({ id: c.id, name: c.name, kind: 'challenge' })} style={chip}>
                  <Text style={{ color: '#e5e7eb' }}>Renombrar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteChallenge(c.id)} style={[chip, { borderColor: '#ef4444' }]}>
                  <Text style={{ color: '#ef4444' }}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {(!challengeInfo || challengeInfo.length === 0) && (
            <Text style={{ color: '#9ca3af' }}>Aún no hay retos. Crea el primero arriba.</Text>
          )}
        </View>
      </View>

      {/* Modal renombrar (sirve para racha o reto) */}
      <EditModal
        visible={!!edit}
        initialTitle={edit?.name}
        onSave={(t) => {
          if (!edit) return;
          if (edit.kind === 'streak') setStreakName(edit.id, t);
          else renameChallenge(edit.id, t);
          setEdit(null);
        }}
        onDelete={null}
        onClose={() => setEdit(null)}
      />
    </ScrollView>
  );
}

// --- estilos chicos en objeto plano ---
const card = { backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1f2937', padding: 16 };
const itemCard = { backgroundColor: '#0b1220', borderRadius: 12, borderWidth: 1, borderColor: '#1f2937', padding: 12 };
const title = { color: '#e5e7eb', fontSize: 16, fontWeight: '700', marginBottom: 6 };
const hint = { color: '#9ca3af' };
const chip = { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#1f2937' };
const chipOn = { backgroundColor: '#22c55e', borderColor: '#22c55e' };
const input = {
  backgroundColor: '#0b1220',
  color: '#e5e7eb',
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: '#1f2937',
};
const btn = { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' };
const btnTxt = { color: '#e5e7eb', fontWeight: '700' };
const btnTxtDark = { color: '#0b1220', fontWeight: '800' };
