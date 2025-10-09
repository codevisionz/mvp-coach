import React, { useEffect, useState } from 'react';
import { View, Text, Switch, TextInput, Button, Alert } from 'react-native';
import { useAuthStore } from '../state/auth';
import { getProfile, updateProfile, Profile } from '../data/profileApi';

export default function SettingsScreen() {
  const logout = useAuthStore(s => s.logout);
  const email = useAuthStore(s => s.email);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [astroEnabled, setAstroEnabled] = useState(false);
  const [birthDate, setBirthDate] = useState<string>('');
  const [birthTime, setBirthTime] = useState<string>('');
  const [birthPlace, setBirthPlace] = useState<string>('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const p = await getProfile();
        setProfile(p);
        setAstroEnabled(!!p.astroEnabled);
        setBirthDate(p.birthDate ?? '');
        setBirthTime(p.birthTime ?? '');
        setBirthPlace(p.birthPlace ?? '');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    try {
      await updateProfile({
        astroEnabled,
        birthDate: birthDate || null,
        birthTime: birthTime || null,
        birthPlace: birthPlace || null
      });
      Alert.alert('Gespeichert', 'Deine Einstellungen wurden aktualisiert.');
    } catch (e: any) {
      Alert.alert('Fehler', e.message ?? 'Konnte Profil nicht speichern.');
    }
  }

  return (
    <View style={{ flex:1, padding:16, gap:12 }}>
      <Text style={{ fontSize:18, fontWeight:'600' }}>Einstellungen</Text>
      <Text style={{ color:'#666' }}>Eingeloggt als: {email ?? '—'}</Text>

      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
        <Text style={{ fontSize:16 }}>Astro-Modus aktivieren</Text>
        <Switch value={astroEnabled} onValueChange={setAstroEnabled} />
      </View>

      <Text style={{ marginTop:8, fontWeight:'600' }}>Geburtsdaten (optional)</Text>
      <TextInput placeholder="Geburtsdatum (YYYY-MM-DD)" value={birthDate} onChangeText={setBirthDate}
        autoCapitalize="none" style={{ borderWidth:1, borderRadius:8, padding:8 }} />
      <TextInput placeholder="Geburtszeit (HH:mm, optional)" value={birthTime} onChangeText={setBirthTime}
        autoCapitalize="none" style={{ borderWidth:1, borderRadius:8, padding:8 }} />
      <TextInput placeholder="Geburtsort (optional)" value={birthPlace} onChangeText={setBirthPlace}
        style={{ borderWidth:1, borderRadius:8, padding:8 }} />

      <Button title={loading ? '...' : 'Speichern'} onPress={save} disabled={loading} />
      <View style={{ height:8 }} />
      <Button title="Logout" onPress={async ()=>{ await logout(); }} />
    </View>
  );
}
