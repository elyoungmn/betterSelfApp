import React, { useState, useEffect } from 'react'; // o solo: import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useStore } from '../context/StoreContext';

export default function ChallengeScreen() {
  const { challenge, setChallengeDone } = useStore();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0b1220' }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
    >
      <Text style={{ color: '#e5e7eb', fontSize: 20, fontWeight: 'bold' }}>
        Reto del día
      </Text>

      <View style={card}>
        <Text style={{ color: '#e5e7eb', fontSize: 16 }}>
          {challenge?.title || '—'}
        </Text>

        <Text
          style={{
            color: challenge?.done ? '#22c55e' : '#9ca3af',
            marginTop: 8,
          }}
        >
          {challenge?.done ? 'Completado ✅' : 'Pendiente'}
        </Text>

        {!challenge?.done && (
          <TouchableOpacity
            onPress={() => setChallengeDone(true)}
            style={btn}
          >
            <Text style={{ color: '#0b1220', fontWeight: 'bold' }}>
              Marcar como hecho
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const card = {
  backgroundColor: '#0f172a',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#1f2937',
  padding: 16,
};
const btn = {
  backgroundColor: '#22c55e',
  padding: 12,
  borderRadius: 12,
  marginTop: 12,
  alignItems: 'center',
};
