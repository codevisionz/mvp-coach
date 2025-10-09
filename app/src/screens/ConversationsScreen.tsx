import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl, Button, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ChatStackParamList } from '../navigation/types';
import { listConversationsLocal } from '../data/repo/chatLocal';
import { runSync } from '../data/sync';

type Props = NativeStackScreenProps<ChatStackParamList, 'Conversations'>;

export default function ConversationsScreen({ navigation }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [offset, setOffset] = useState(0);
  const [done, setDone] = useState(false);
  const pageSize = 20;

  function load(reset=false) {
    const rows = listConversationsLocal(pageSize, reset ? 0 : offset);
    if (reset) {
      setItems(rows);
      setOffset(rows.length);
      setDone(rows.length < pageSize);
    } else {
      setItems(prev => [...prev, ...rows]);
      setOffset(prev => prev + rows.length);
      if (rows.length < pageSize) setDone(true);
    }
  }

  useEffect(() => { (async () => { await runSync(); load(true); })(); }, []);

  async function onRefresh() {
    setRefreshing(true);
    try { await runSync(); load(true); }
    finally { setRefreshing(false); }
  }

  function onEndReached() {
    if (!done) load(false);
  }

  const fmt = (ms: number) => new Date(ms).toLocaleString();

  return (
    <View style={{ flex:1, padding: 12 }}>
      <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: '700' }}>Deine Unterhaltungen</Text>
        <Button title="Neu" onPress={() => navigation.navigate('Chat', { conversationId: undefined })} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(x) => x.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('Chat', { conversationId: item.id })}
            style={{ paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' }}
          >
            <Text style={{ fontWeight:'600' }}>{item.mode === 'astroCoach' ? 'Astro-Coach' : 'Coach'}</Text>
            <Text style={{ color:'#666', marginTop: 2 }}>Aktualisiert: {fmt(item.updated_at)}</Text>
          </TouchableOpacity>
        )}
        onEndReachedThreshold={0.2}
        onEndReached={onEndReached}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<View style={{ padding: 16 }}><Text style={{ color:'#666' }}>Noch keine Unterhaltungen.</Text></View>}
      />
    </View>
  );
}
