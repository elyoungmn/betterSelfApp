import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useStore } from '../context/StoreContext';
import TaskItem from '../components/TaskItem';
export default function TasksScreen(){
  const { tasks, addTask, toggleTask, removeTask } = useStore();
  const [title, setTitle] = useState('');
  const onAdd = () => { addTask(title); setTitle(''); };
  return (
    <ScrollView style={{flex:1, backgroundColor:'#0b1220'}} contentContainerStyle={{padding:16}}>
      <Text style={{ color:'#e5e7eb', fontSize:20, fontWeight:'bold', marginBottom:12 }}>Tareas diarias</Text>
      <View style={{ flexDirection:'row', gap:8 }}>
        <TextInput placeholder="Nueva tarea..." placeholderTextColor="#6b7280" value={title} onChangeText={setTitle} style={{...input, flex:1}} onSubmitEditing={onAdd} returnKeyType="done"/>
        <TouchableOpacity onPress={onAdd} style={btn}><Text style={{ color:'#0b1220', fontWeight:'bold' }}>Agregar</Text></TouchableOpacity>
      </View>
      <View style={{ marginTop:16 }}>{tasks.map(t => (<TaskItem key={t.id} title={t.title} done={t.done} onToggle={()=>toggleTask(t.id)} onDelete={()=>removeTask(t.id)} />))}{tasks.length===0 && <Text style={{color:'#9ca3af'}}>Sin tareas por ahora</Text>}</View>
    </ScrollView>
  );
}
const input = { backgroundColor:'#0f172a', color:'#e5e7eb', padding:12, borderRadius:12, borderWidth:1, borderColor:'#1f2937' };
const btn = { backgroundColor:'#22c55e', paddingHorizontal:16, borderRadius:12, justifyContent:'center' };