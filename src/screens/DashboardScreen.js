// src/screens/DashboardScreen.js
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../context/StoreContext';
import ProgressBar from '../components/ProgressBar';
import HabitItem from '../components/HabitItem'; // Reutilizamos el mismo estilo para todo

export default function DashboardScreen() {
  const nav = useNavigation();

  const {
    // Rutinas
    routine, toggleRoutine,
    nightRoutine, toggleNightRoutine,

    // Tareas
    tasks, addTask, toggleTask, removeTask,

    // Hábitos
    habits,
    resetHabitsToDefault,
    habitCountsToday,
    bumpHabitCount,
    setHabitPerDay,
    addHabit,

    // Otros
    challenge, setChallengeDone,
    tmi,
  } = useStore();

  // ─────────────────────────────────────────────
  // Estado local (inputs y modal perDay para HÁBITOS)
  // ─────────────────────────────────────────────
  const [newTask, setNewTask] = useState('');
  const [newHabit, setNewHabit] = useState('');
  const [perDayEditor, setPerDayEditor] = useState({ visible: false, id: null, title: '', perDay: 1 });

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    addTask(newTask.trim());
    setNewTask('');
  };
  const handleAddHabit = () => {
    if (!newHabit.trim()) return;
    addHabit(newHabit.trim());
    setNewHabit('');
  };

  const openPerDayEditor = (h) => {
    setPerDayEditor({ visible: true, id: h.id, title: h.title, perDay: h.perDay || 1 });
  };
  const closePerDayEditor = () => setPerDayEditor({ visible: false, id: null, title: '', perDay: 1 });
  const savePerDayEditor = () => {
    if (perDayEditor.id) setHabitPerDay(perDayEditor.id, perDayEditor.perDay);
    closePerDayEditor();
  };

  // ─────────────────────────────────────────────
  // Progresos
  // ─────────────────────────────────────────────
  const routineProgress = useMemo(
    () => (routine.length ? routine.filter(r => r.done).length / routine.length : 0),
    [routine]
  );

  const nightRoutineProgress = useMemo(
    () => (nightRoutine.length ? nightRoutine.filter(r => r.done).length / nightRoutine.length : 0),
    [nightRoutine]
  );

  const tasksProgress = useMemo(
    () => (tasks.length ? tasks.filter(t => t.done).length / tasks.length : 0),
    [tasks]
  );

  const habitsDone = useMemo(() => {
    let done = 0;
    for (const h of habits) {
      const per = h?.perDay ?? 1;
      const cnt = habitCountsToday?.[h.id] ?? 0;
      if (cnt >= per) done += 1;
    }
    return done;
  }, [habits, habitCountsToday]);
  const habitsTotal = habits.length || 0;
  const habitsProgress = habitsTotal ? habitsDone / habitsTotal : 0;

  // ─────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0b1220' }} contentContainerStyle={{ padding: 16, gap: 16 }}>

      {/* Banner TMI */}
      <TouchableOpacity onPress={() => nav.navigate('Diario')} style={tmiCard}>
        <Text style={{ color:'#9ca3af', fontSize:12, marginBottom:6 }}>TMI de hoy</Text>
        <Text style={{ color:'#e5e7eb', fontSize:16 }}>
          {tmi?.trim() ? tmi : 'Pulsa para establecer tu TMI en el Diario'}
        </Text>
      </TouchableOpacity>

      <Text style={{ color: '#e5e7eb', fontSize: 22, fontWeight: 'bold' }}>Resumen del día</Text>

      {/* Rutina matutina (con estilo de Hábitos) */}
      <View style={cardStyle}>
        <Text style={titleStyle}>Rutina matutina</Text>
        <ProgressBar progress={routineProgress} />
        <Text style={hintStyle}>{Math.round(routineProgress * 100)}% completado</Text>
        <View style={{ marginTop: 12, gap: 12 }}>
          {routine.map(i => (
            <HabitItem
              key={i.id}
              title={i.title}
              count={i.done ? 1 : 0}
              perDay={1}
              // Tocar suma/toggle 0⇄1
              onPress={() => toggleRoutine(i.id)}
              // Mantener presionado: también toggle (o podrías no hacer nada)
              onLongPress={() => toggleRoutine(i.id)}
              // No hay editor perDay aquí
              onTitlePress={undefined}
            />
          ))}
          {routine.length === 0 && <Text style={{ color: '#9ca3af' }}>No hay elementos</Text>}
        </View>
      </View>

      {/* Hábitos */}
      <View style={cardStyle}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
          <Text style={titleStyle}>Hábitos</Text>
          <TouchableOpacity onPress={resetHabitsToDefault}>
            <Text style={{ color:'#22c55e' }}>Reiniciar</Text>
          </TouchableOpacity>
        </View>

        {/* Input nuevo hábito */}
        <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:12, marginTop:4 }}>
          <TextInput
            placeholder="Nuevo hábito..."
            placeholderTextColor="#6b7280"
            value={newHabit}
            onChangeText={setNewHabit}
            onSubmitEditing={handleAddHabit}
            returnKeyType="done"
            style={inputStyle}
          />
          <TouchableOpacity onPress={handleAddHabit} style={addBtnStyle}>
            <Text style={{ color:'#0b1220', fontWeight:'bold' }}>Agregar</Text>
          </TouchableOpacity>
        </View>

        <ProgressBar progress={habitsProgress} />
        <Text style={hintStyle}>{habitsDone}/{habitsTotal} completados hoy</Text>

        <View style={{ marginTop: 12, gap: 12 }}>
          {habits.map((h) => {
            const count = habitCountsToday?.[h.id] ?? 0;
            return (
              <HabitItem
                key={h.id}
                title={h.title}
                count={count}
                perDay={h.perDay || 1}
                // 👉 Tocar en cualquier parte (menos el texto) => +1
                onPress={() => bumpHabitCount(h.id, +1)}
                // 👉 Mantener presionado => -1
                onLongPress={() => bumpHabitCount(h.id, -1)}
                // 👉 SOLO el texto abre el editor de perDay
                onTitlePress={() => openPerDayEditor(h)}
              />
            );
          })}
          {habits.length === 0 && <Text style={{ color: '#9ca3af' }}>No hay hábitos aún. Añade uno o toca “Reiniciar”.</Text>}
        </View>
      </View>

      {/* Tareas diarias (con estilo de Hábitos) */}
      <View style={cardStyle}>
        <Text style={titleStyle}>Tareas diarias</Text>

        <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:12, marginTop:4 }}>
          <TextInput
            placeholder="Nueva tarea para hoy..."
            placeholderTextColor="#6b7280"
            value={newTask}
            onChangeText={setNewTask}
            onSubmitEditing={handleAddTask}
            returnKeyType="done"
            style={inputStyle}
          />
          <TouchableOpacity onPress={handleAddTask} style={addBtnStyle}>
            <Text style={{ color:'#0b1220', fontWeight:'bold' }}>Agregar</Text>
          </TouchableOpacity>
        </View>

        <ProgressBar progress={tasksProgress} />
        <Text style={hintStyle}>{Math.round(tasksProgress * 100)}% completado</Text>

        <View style={{ marginTop: 12, gap: 12 }}>
          {tasks.map(t => (
            <HabitItem
              key={t.id}
              title={t.title}
              count={t.done ? 1 : 0}
              perDay={1}
              // Tap: toggle
              onPress={() => toggleTask(t.id)}
              // Long-press: eliminar tarea (puedes cambiarlo a toggle si prefieres)
              onLongPress={() => removeTask(t.id)}
              onTitlePress={undefined}
            />
          ))}
          {tasks.length === 0 && <Text style={{ color: '#9ca3af' }}>Sin tareas por ahora</Text>}
        </View>
      </View>

      {/* Rutina nocturna (con estilo de Hábitos) */}
      <View style={cardStyle}>
        <Text style={titleStyle}>Rutina nocturna</Text>
        <ProgressBar progress={nightRoutineProgress} />
        <Text style={hintStyle}>{Math.round(nightRoutineProgress * 100)}% completado</Text>
        <View style={{ marginTop: 12, gap: 12 }}>
          {nightRoutine.map(i => (
            <HabitItem
              key={i.id}
              title={i.title}
              count={i.done ? 1 : 0}
              perDay={1}
              onPress={() => toggleNightRoutine(i.id)}
              onLongPress={() => toggleNightRoutine(i.id)}
              onTitlePress={undefined}
            />
          ))}
          {nightRoutine.length === 0 && <Text style={{ color: '#9ca3af' }}>No hay elementos</Text>}
        </View>
      </View>

      {/* Reto del día — tap para marcar como hecho */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setChallengeDone(!(challenge?.done))}
        style={[cardStyle, { borderColor: challenge?.done ? '#22c55e' : '#1f2937' }]}
      >
        <Text style={titleStyle}>Reto del día</Text>
        <Text style={{ color: '#e5e7eb', marginTop: 8 }}>{challenge?.title || '—'}</Text>
        <Text style={{ color: challenge?.done ? '#22c55e' : '#9ca3af', marginTop: 4 }}>
          {challenge?.done ? 'Completado ✅ (toca para desmarcar)' : 'Pendiente (toca para marcar)'}
        </Text>
      </TouchableOpacity>

      {/* Modal perDay (solo hábitos) */}
      <Modal
        visible={perDayEditor.visible}
        transparent
        animationType="slide"
        onRequestClose={closePerDayEditor}
      >
        <View style={{
          flex:1, backgroundColor:'rgba(0,0,0,0.45)', justifyContent:'center', alignItems:'center', padding:24
        }}>
          <View style={{ width:'100%', backgroundColor:'#0f172a', borderRadius:16, padding:16, borderWidth:1, borderColor:'#1f2937' }}>
            <Text style={{ color:'#e5e7eb', fontSize:16, fontWeight:'700', marginBottom:8 }}>
              {perDayEditor.title}
            </Text>
            <Text style={{ color:'#9ca3af', marginBottom:12 }}>
              ¿Cuántas veces al día quieres realizar este hábito?
            </Text>

            <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
              <Pressable
                onPress={() => setPerDayEditor(p => ({ ...p, perDay: Math.max(1, (p.perDay || 1) - 1) }))}
                style={{ backgroundColor:'#132334', paddingVertical:10, paddingHorizontal:16, borderRadius:12 }}
              >
                <Text style={{ color:'#e5e7eb', fontSize:18 }}>−</Text>
              </Pressable>

              <Text style={{ color:'#e5e7eb', fontSize:22, fontWeight:'800' }}>
                {perDayEditor.perDay || 1} veces/día
              </Text>

              <Pressable
                onPress={() => setPerDayEditor(p => ({ ...p, perDay: Math.min(24, (p.perDay || 1) + 1) }))}
                style={{ backgroundColor:'#132334', paddingVertical:10, paddingHorizontal:16, borderRadius:12 }}
              >
                <Text style={{ color:'#e5e7eb', fontSize:18 }}>+</Text>
              </Pressable>
            </View>

            <View style={{ flexDirection:'row', justifyContent:'flex-end', gap:12, marginTop:16 }}>
              <Pressable onPress={closePerDayEditor} style={{ paddingVertical:10, paddingHorizontal:16 }}>
                <Text style={{ color:'#9ca3af' }}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={savePerDayEditor}
                style={{ backgroundColor:'#22c55e', paddingVertical:10, paddingHorizontal:16, borderRadius:10 }}
              >
                <Text style={{ color:'#0b1220', fontWeight:'700' }}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ── estilos base
const tmiCard = { backgroundColor:'#0f172a', borderRadius:16, borderWidth:1, borderColor:'#1f2937', padding:16 };
const cardStyle = { backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1f2937', padding: 16 };
const titleStyle = { color: '#e5e7eb', fontSize: 16, fontWeight: '600', marginBottom: 8 };
const hintStyle = { color: '#9ca3af', marginTop: 8 };
const inputStyle = { flex: 1, backgroundColor: '#0f172a', color: '#e5e7eb', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#1f2937' };
const addBtnStyle = { backgroundColor: '#22c55e', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 };
