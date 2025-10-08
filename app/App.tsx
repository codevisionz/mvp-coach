import 'react-native-get-random-values'; // vor dem uuid-Import laden
import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, Button, TextInput, FlatList } from 'react-native';
import { migrate } from './src/data/db';
import { addLocalCheckIn, listLocalCheckIns, Mood } from './src/data/repo/checkins';
import { runSync } from './src/data/sync';
import { useAutoSync } from './src/hooks/useAutoSync';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  const [items, setItems] = useState<any[]>([]);
  
  useEffect(() => { migrate(); refresh(); }, []);
  useAutoSync(60_000); // alle 60s + onFocus

  function refresh() { setItems(listLocalCheckIns()); }

  return <RootNavigator />;

  /*return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ padding: 16, gap: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: '600' }}>MVP Coach (Offline-First)</Text>

        <TextInput placeholder="E-Mail" value={email} onChangeText={setEmail}
          autoCapitalize="none" style={{ borderWidth:1, padding:8, borderRadius:8 }} />
        <TextInput placeholder="Passwort" value={pwd} onChangeText={setPwd} secureTextEntry
          style={{ borderWidth:1, padding:8, borderRadius:8 }} />
        <Button title="Login / Signup" onPress={onAuth} />

        <View style={{ height: 12 }} />
        <TextInput placeholder="Notiz" value={note} onChangeText={setNote}
          style={{ borderWidth:1, padding:8, borderRadius:8 }} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <Button title="😔" onPress={() => setMood(1)} />
          <Button title="🙁" onPress={() => setMood(2)} />
          <Button title="😐" onPress={() => setMood(3)} />
          <Button title="🙂" onPress={() => setMood(4)} />
          <Button title="😄" onPress={() => setMood(5)} />
        </View>
        <Button title="Check-in speichern (offline)" onPress={onAdd} />
        <Button title="Jetzt synchronisieren" onPress={onSync} />

        <View style={{ height: 16 }} />
        <Text style={{ fontWeight: '600' }}>Letzte Check-ins (lokal):</Text>
        <FlatList
          data={items}
          keyExtractor={(x) => x.id}
          renderItem={({ item }) => (
            <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' }}>
              <Text>{item.date} • Mood {item.mood}</Text>
              {item.note ? <Text style={{ color: '#555' }}>{item.note}</Text> : null}
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );*/
}