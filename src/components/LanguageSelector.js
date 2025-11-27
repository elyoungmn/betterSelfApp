// src/components/LanguageSelector.js
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSelector() {
    const { currentLanguage, changeLanguage } = useLanguage();

    return (
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Text style={{ color: '#9ca3af', marginRight: 8 }}>Language:</Text>
            <TouchableOpacity
                onPress={() => changeLanguage('es')}
                style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: currentLanguage === 'es' ? '#22c55e' : '#1f2937',
                }}
            >
                <Text style={{ color: currentLanguage === 'es' ? '#0b1220' : '#e5e7eb', fontWeight: '600' }}>
                    Español
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => changeLanguage('en')}
                style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: currentLanguage === 'en' ? '#22c55e' : '#1f2937',
                }}
            >
                <Text style={{ color: currentLanguage === 'en' ? '#0b1220' : '#e5e7eb', fontWeight: '600' }}>
                    English
                </Text>
            </TouchableOpacity>
        </View>
    );
}
