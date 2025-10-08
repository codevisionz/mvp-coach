import React from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { useAuthStore } from '../state/auth';

export default function SettingsScreen() {
  const logout = useAuthStore(s => s.logout);
  const email = useAuthStore(s => s.email);

  return (
    <View style={{ flex:1, padding:16, gap:12 }}>
      <Text style={{ fontSize:18, fontWeight:'600' }}>Einstellungen</Text>
      <Text style={{ color:'#666' }}>Eingeloggt als: {email ?? '—'}</Text>
      <Button title="Logout" onPress={async ()=>{
        await logout();
        Alert.alert('Abgemeldet', 'Du wurdest abgemeldet.');
      }} />
    </View>
  );
}
