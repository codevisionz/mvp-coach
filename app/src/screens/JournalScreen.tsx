import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList } from 'react-native';
import { addLocalJournal, listLocalJournals, updateLocalJournal, softDeleteLocalJournal } from '../data/repo/journals';
import { runSync } from '../data/sync';

export default function JournalScreen() {
  const [text, setText] = useState('');
  const [items, setItems] = useState<any[]>([]);

  function refresh() { setItems(listLocalJournals()); }

  useEffect(() => { refresh(); }, []);

  function onAdd() {
    if (!text.trim()) return;
    addLocalJournal({ text });
    setText('');
    refresh();
  }

  async function onSync() {
    await runSync();
    refresh();
  }

  return (
    <View style={{ padding: 16, gap: 8, flex: 1 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Journal</Text>
      <TextInput
        placeholder="Dein Eintrag..."
        value={text}
        onChangeText={setText}
        multiline
        style={{ borderWidth:1, borderRadius:8, padding:8, minHeight:80 }}
      />
      <Button title="Eintrag speichern (offline)" onPress={onAdd} />
      <Button title="Sync" onPress={onSync} />

      <FlatList
        style={{ marginTop: 12 }}
        data={items}
        keyExtractor={(x) => x.id}
        renderItem={({ item }) => (
          <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' }}>
            <Text style={{ fontWeight: '600' }}>
              {new Date(item.updated_at).toLocaleString()}
            </Text>
            <Text style={{ marginTop: 4 }}>{item.text}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
              <Button title="Bearb." onPress={() => {
                updateLocalJournal(item.id, { text: item.text + ' ✍️' });
                refresh();
              }} />
              <Button title="Löschen" onPress={() => { softDeleteLocalJournal(item.id); refresh(); }} />
            </View>
          </View>
        )}
      />
    </View>
  );
}
