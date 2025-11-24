import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';

import { View, Text, TextInput, ScrollView } from 'react-native';
import { getTodayKey } from '../utils/date';
import { loadJSON, saveJSON } from '../utils/storage';

const card = { backgroundColor:'#0f172a', borderRadius:16, borderWidth:1, borderColor:'#1f2937', padding:16, marginBottom:16 };
const title = { color:'#e5e7eb', fontSize:16, fontWeight:'600', marginBottom:8 };
const label = { color:'#9ca3af', marginBottom:6 };
const input = { backgroundColor:'#0b1220', color:'#e5e7eb', padding:12, borderRadius:12, borderWidth:1, borderColor:'#1f2937' };
const small = { color:'#6b7280', fontSize:12, marginTop:6 };

export default function JournalScreen(){
  const [dateKey, setDateKey] = useState(getTodayKey());
  const [tmi, setTmi] = useState('');
  const [gratitude, setGratitude] = useState(['','','']);
  const [affirmations, setAffirmations] = useState(['','','']);
  const [victories, setVictories] = useState('');
  const [notes, setNotes] = useState('');

  // Load today's journal on mount
  useEffect(() => {
    async function init(){
      const key = getTodayKey();
      setDateKey(key);
      const stored = await loadJSON('journal_' + key);
      if (stored){
        setTmi(stored.tmi || '');
        setGratitude(stored.gratitude || ['','','']);
        setAffirmations(stored.affirmations || ['','','']);
        setVictories(stored.victories || '');
        setNotes(stored.notes || '');
      }
    }
    init();
  }, []);

  // Debounced autosave
  const debounceRef = useRef(null);
  useEffect(() => {
    const data = { tmi, gratitude, affirmations, victories, notes };
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveJSON('journal_' + dateKey, data);
    }, 300);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [tmi, gratitude, affirmations, victories, notes, dateKey]);

  const setGratItem = (idx, val) => {
    setGratitude(prev => { const next = [...prev]; next[idx] = val; return next; });
  };
  const setAffItem = (idx, val) => {
    setAffirmations(prev => { const next = [...prev]; next[idx] = val; return next; });
  };

  return (
    <ScrollView style={{ flex:1, backgroundColor:'#0b1220' }} contentContainerStyle={{ padding:16 }}>
      <Text style={{ color:'#e5e7eb', fontSize:22, fontWeight:'bold', marginBottom:12 }}>Diario</Text>
      <Text style={{ color:'#9ca3af', marginBottom:12 }}>{dateKey}</Text>

      {/* TMI */}
      <View style={card}>
        <Text style={title}>TMI — Tarea más importante del día</Text>
        <TextInput
          placeholder="¿Qué tarea define tu día?"
          placeholderTextColor="#6b7280"
          value={tmi}
          onChangeText={setTmi}
          style={input}
        />
        <Text style={small}>Se guarda automáticamente.</Text>
      </View>

      {/* Gratitud (3) */}
      <View style={card}>
        <Text style={title}>Gratitud — 3 cosas</Text>
        {[0,1,2].map(i => (
          <View key={i} style={{ marginBottom:8 }}>
            <Text style={label}>#{i+1}</Text>
            <TextInput
              placeholder="Escribe algo por lo que estés agradecido"
              placeholderTextColor="#6b7280"
              value={gratitude[i]}
              onChangeText={(v)=>setGratItem(i,v)}
              style={input}
            />
          </View>
        ))}
      </View>

      {/* Afirmaciones (3) */}
      <View style={card}>
        <Text style={title}>Afirmaciones del día — 3</Text>
        {[0,1,2].map(i => (
          <View key={i} style={{ marginBottom:8 }}>
            <Text style={label}>#{i+1}</Text>
            <TextInput
              placeholder="Ej: Soy constante, puedo con esto, hoy progreso 1%"
              placeholderTextColor="#6b7280"
              value={affirmations[i]}
              onChangeText={(v)=>setAffItem(i,v)}
              style={input}
            />
          </View>
        ))}
      </View>

      {/* Victorias */}
      <View style={card}>
        <Text style={title}>Victorias del día</Text>
        <TextInput
          placeholder="¿Qué salió bien hoy?"
          placeholderTextColor="#6b7280"
          value={victories}
          onChangeText={setVictories}
          style={[input, { minHeight:90 }]}
          multiline
        />
      </View>

      {/* Apuntes */}
      <View style={card}>
        <Text style={title}>Apuntes del día</Text>
        <TextInput
          placeholder="Notas libres, ideas, pendientes rápidos..."
          placeholderTextColor="#6b7280"
          value={notes}
          onChangeText={setNotes}
          style={[input, { minHeight:120 }]}
          multiline
        />
      </View>
    </ScrollView>
  );
}