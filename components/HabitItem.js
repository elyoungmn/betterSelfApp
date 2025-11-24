
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function HabitItem({ title, streak = 0, doneToday = false, onToggle, onDelete }){
  return (
    <View style={row}>
      <TouchableOpacity onPress={onToggle} style={[check, doneToday && checkOn]}>
        {doneToday && <Text style={{ color:'#0b1220', fontWeight:'bold' }}>✓</Text>}
      </TouchableOpacity>
      <View style={{ flex:1 }}>
        <Text style={{ color:'#e5e7eb' }}>{title}</Text>
        <Text style={{ color:'#9ca3af', fontSize:12 }}>Racha: {streak} días</Text>
      </View>
      {onDelete && (
        <TouchableOpacity onPress={onDelete} hitSlop={{top:8,bottom:8,left:8,right:8}}>
          <Text style={{ color:'#ef4444', fontWeight:'bold' }}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const row = { flexDirection:'row', alignItems:'center', paddingVertical:8, gap:12 };
const check = { width:22, height:22, borderRadius:6, borderWidth:1, borderColor:'#374151', alignItems:'center', justifyContent:'center' };
const checkOn = { backgroundColor:'#22c55e', borderColor:'#22c55e' };
