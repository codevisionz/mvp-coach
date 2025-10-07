import React from 'react';
import { View, Text } from 'react-native';

export default function SettingsScreen() {
  return (
    <View style={{ flex:1, padding:16 }}>
      <Text style={{ fontSize:18, fontWeight:'600' }}>Einstellungen</Text>
      <Text style={{ marginTop:8, color:'#666' }}>
        Hier kannst du später Astro, Datenschutz, Export etc. konfigurieren.
      </Text>
    </View>
  );
}
