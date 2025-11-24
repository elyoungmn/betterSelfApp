import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { useStore } from '../context/StoreContext';
import TaskItem from '../components/TaskItem';

export default function NightRoutineScreen() {
  const { nightRoutine, toggleNightRoutine } = useStore();
  const [filter, setFilter] = useState('');

  const items = nightRoutine.filter(r => r.title.toLowerCase().includes(filter.toLowerCase()));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0b1220' }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ color: '#e5e7eb', fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>Rutina nocturna</Text>
      <TextInput
        placeholder="Filtrar..."
        placeholderTextColor="#6b7280"
        value={filter}
        onChangeText={setFilter}
        style={inputStyle}
      />
      <View style={{ marginTop: 12 }}>
        {items.map(i => (
          <TaskItem key={i.id} title={i.title} done={i.done} onToggle={() => toggleNightRoutine(i.id)} />
        ))}
        {items.length === 0 && <Text style={{ color: '#9ca3af' }}>No hay elementos</Text>}
      </View>
    </ScrollView>
  );
}

const inputStyle = {
  backgroundColor: '#0f172a',
  color: '#e5e7eb',
  padding: 12,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#1f2937'
};