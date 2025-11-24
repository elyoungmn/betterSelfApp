import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useStore } from '../context/StoreContext';
export default function ProfileScreen(){
  const { todayKey } = useStore();
  return (
    <ScrollView style={{flex:1, backgroundColor:'#0b1220'}} contentContainerStyle={{padding:16, gap:12}}>
      <Text style={{ color:'#e5e7eb', fontSize:20, fontWeight:'bold' }}>Perfil</Text>
      <View style={card}>
        <Text style={{ color:'#9ca3af' }}>Día actual</Text>
        <Text style={{ color:'#e5e7eb', marginTop:6 }}>{todayKey}</Text>
      </View>
      <Text style={{ color:'#9ca3af' }}>Luego agregamos backup/export y sincronización.</Text>
    </ScrollView>
  );
}
const card = { backgroundColor:'#0f172a', borderRadius:16, borderWidth:1, borderColor:'#1f2937', padding:16 };