import React, { useMemo, useState } from 'react';

import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useStore } from '../context/StoreContext';
import HabitItem from '../components/HabitItem';
export default function HabitsScreen(){
  const { habits, habitsDoneToday, addHabit, removeHabit, toggleHabitToday } = useStore();
  const [title, setTitle] = useState('');
  const onAdd = () => { addHabit(title); setTitle(''); };
  return (
    <ScrollView style={{flex:1, backgroundColor:'#0b1220'}} contentContainerStyle={{padding:16}}>
      <Text style={{ color:'#e5e7eb', fontSize:20, fontWeight:'bold', marginBottom:12 }}>Hábitos</Text>
      <View style={{ flexDirection:'row', gap:8 }}>
        <TextInput placeholder="Nuevo hábito..." placeholderTextColor="#6b7280" value={title} onChangeText={setTitle} style={{...input, flex:1}} onSubmitEditing={onAdd} returnKeyType="done"/>
        <TouchableOpacity onPress={onAdd} style={btn}><Text style={{ color:'#0b1220', fontWeight:'bold' }}>Agregar</Text></TouchableOpacity>
      </View>
      <View style={{ marginTop:16 }}>{habits.map(h => (<HabitItem key={h.id} title={h.title} doneToday={!!habitsDoneToday[h.id]} streak={h.streak} onToggle={()=>toggleHabitToday(h.id)} onDelete={()=>removeHabit(h.id)} />))}{habits.length===0 && <Text style={{color:'#9ca3af'}}>Agrega tus hábitos</Text>}</View>
    </ScrollView>
  );
}
const input = { backgroundColor:'#0f172a', color:'#e5e7eb', padding:12, borderRadius:12, borderWidth:1, borderColor:'#1f2937' };
const btn = { backgroundColor:'#22c55e', paddingHorizontal:16, borderRadius:12, justifyContent:'center' };