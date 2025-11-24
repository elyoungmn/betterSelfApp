import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';

import { View, Text, Pressable } from 'react-native';

export default function TaskItem({ title, done = false, onToggle, onLongPress }) {
  return (
    <Pressable
      onPress={onToggle}
      onLongPress={onLongPress}
      android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
      style={({ pressed }) => [row, pressed && pressedRow]}
      accessibilityRole="button"
      accessibilityState={{ checked: done }}
      accessibilityLabel={title}
    >
      <View style={[check, done && checkOn]}>
        {done && <Text style={checkTick}>✓</Text>}
      </View>
      <Text style={[text, done && textDone]} numberOfLines={2}>{title}</Text>
    </Pressable>
  );
}

const row = { flexDirection:'row', alignItems:'center', paddingVertical:10, gap:12 };
const pressedRow = { opacity:0.85 };
const check = { width:22, height:22, borderRadius:6, borderWidth:1, borderColor:'#374151', alignItems:'center', justifyContent:'center' };
const checkOn = { backgroundColor:'#22c55e', borderColor:'#22c55e' };
const checkTick = { color:'#0b1220', fontWeight:'bold' };
const text = { color:'#e5e7eb', flex:1 };
const textDone = { textDecorationLine:'line-through', color:'#9ca3af' };
