import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity } from 'react-native';

export default function EditModal({ visible, initialTitle, onSave, onDelete, onClose }) {
  const [title, setTitle] = useState(initialTitle || '');
  useEffect(() => setTitle(initialTitle || ''), [initialTitle, visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={backdrop}>
        <View style={sheet}>
          <Text style={titleStyle}>Editar</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Título..."
            placeholderTextColor="#6b7280"
            style={input}
            autoFocus
          />
          <View style={row}>
            <TouchableOpacity onPress={onClose} style={[btn, { backgroundColor:'#334155' }]}>
              <Text style={btnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onSave(title.trim())} style={[btn, { backgroundColor:'#22c55e' }]}>
              <Text style={btnTextDark}>Guardar</Text>
            </TouchableOpacity>
          </View>

          {!!onDelete && (
            <TouchableOpacity onPress={onDelete} style={danger}>
              <Text style={dangerText}>Eliminar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const backdrop = { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', padding:24 };
const sheet = { backgroundColor:'#0f172a', borderRadius:16, borderWidth:1, borderColor:'#1f2937', padding:16 };
const titleStyle = { color:'#e5e7eb', fontSize:16, fontWeight:'700', marginBottom:10 };
const input = { backgroundColor:'#0b1220', color:'#e5e7eb', borderWidth:1, borderColor:'#1f2937', borderRadius:12, padding:12, marginBottom:12 };
const row = { flexDirection:'row', gap:10 };
const btn = { flex:1, paddingVertical:12, borderRadius:12, alignItems:'center' };
const btnText = { color:'#e5e7eb', fontWeight:'700' };
const btnTextDark = { color:'#0b1220', fontWeight:'800' };
const danger = { marginTop:12, paddingVertical:10, borderRadius:10, alignItems:'center', borderWidth:1, borderColor:'#ef4444' };
const dangerText = { color:'#ef4444', fontWeight:'700' };
