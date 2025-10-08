import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

export default function SplashScreen() {
  return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', gap:8 }}>
      <ActivityIndicator />
      <Text>Bitte warten…</Text>
    </View>
  );
}
