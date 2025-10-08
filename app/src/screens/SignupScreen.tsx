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

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

export default function SignupScreen({ navigation }: Props) {
  const [email, setEmail] = useState('demo@example.com');
  const [pwd, setPwd] = useState('password123');
  const signup = useAuthStore(s => s.signup);

  async function onSignup() {
    const parsed = Schema.safeParse({ email, password: pwd });
    if (!parsed.success) {
      Alert.alert('Fehler', parsed.error.errors[0].message);
      return;
    }
    try {
      await signup(email, pwd);
    } catch (e: any) {
      Alert.alert('Signup fehlgeschlagen', e.message ?? 'Unbekannter Fehler');
    }
  }

  return (
    <View style={{ flex:1, padding:16, gap:8, justifyContent:'center' }}>
      <Text style={{ fontSize:22, fontWeight:'700' }}>Account erstellen</Text>
      <TextInput value={email} onChangeText={setEmail}
        placeholder="E-Mail" autoCapitalize="none"
        style={{ borderWidth:1, borderRadius:8, padding:10 }} />
      <TextInput value={pwd} onChangeText={setPwd}
        placeholder="Passwort (min. 8 Zeichen)" secureTextEntry
        style={{ borderWidth:1, borderRadius:8, padding:10 }} />
      <Button title="Signup" onPress={onSignup} />
      <View style={{ height: 8 }} />
      <Button title="Schon ein Konto? → Login" onPress={() => navigation.replace('Login')} />
    </View>
  );
}
