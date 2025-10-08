import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { z } from 'zod';
import { useAuthStore } from '../state/auth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const Schema = z.object({
  email: z.string().email('Ungültige E-Mail'),
  password: z.string().min(8, 'Mindestens 8 Zeichen')
});

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('demo@example.com');
  const [pwd, setPwd] = useState('password123');
  const login = useAuthStore(s => s.login);

  async function onLogin() {
    const parsed = Schema.safeParse({ email, password: pwd });
    if (!parsed.success) {
      Alert.alert('Fehler', parsed.error.errors[0].message);
      return;
    }
    try {
      await login(email, pwd);
    } catch (e: any) {
      Alert.alert('Login fehlgeschlagen', e.message ?? 'Unbekannter Fehler');
    }
  }

  return (
    <View style={{ flex:1, padding:16, gap:8, justifyContent:'center' }}>
      <Text style={{ fontSize:22, fontWeight:'700' }}>Willkommen zurück</Text>
      <TextInput value={email} onChangeText={setEmail}
        placeholder="E-Mail" autoCapitalize="none"
        style={{ borderWidth:1, borderRadius:8, padding:10 }} />
      <TextInput value={pwd} onChangeText={setPwd}
        placeholder="Passwort" secureTextEntry
        style={{ borderWidth:1, borderRadius:8, padding:10 }} />
      <Button title="Login" onPress={onLogin} />
      <View style={{ height: 8 }} />
      <Button title="Noch keinen Account? → Signup" onPress={() => navigation.replace('Signup')} />
    </View>
  );
}
