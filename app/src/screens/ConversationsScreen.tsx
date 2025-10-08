import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl, Button, TouchableOpacity } from 'react-native';
import { listConversations } from '../data/chatApi';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ChatStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<ChatStackParamList, 'Conversations'>;

type Row = {
  id: string;
  mode: string;
  updatedAt: string;
  createdAt: string;
};

export default function ConversationsScreen({ navigation }: Props) {
  const [items, setItems] = useState<Row[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const pageSize = 20;

  async function load(reset = false) {
    if (loadingMore && !reset) return;
    if (reset) { setOffset(0); }
    setLoadingMore(true);
    try {
      const { items: rows, total } = await listConversations(pageSize, reset ? 0 : offset);
      setTotal(total);
      if (reset) setItems(rows as any);
      else setItems(prev => [...prev, ...(rows as any)]);
      setOffset(prev => (reset ? rows.length : prev + rows.length));
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => { load(true); }, []);

  function onEndReached() {
    if (total !== null && offset >= total) return; // nichts mehr
    load(false);
  }

  async function onRefresh() {
    setRefreshing(true);
    try { await load(true); }
    finally { setRefreshing(false); }
  }

  function fmt(dt: string) {
    try { return new Date(dt).toLocaleString(); } catch { return dt; }
  }

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
            <Text style={{ color:'#666', marginTop: 2 }}>Aktualisiert: {fmt(item.updatedAt)}</Text>
          </TouchableOpacity>
        )}
        onEndReachedThreshold={0.2}
        onEndReached={onEndReached}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListFooterComponent={
          loadingMore ? <Text style={{ textAlign:'center', padding: 8 }}>Lade…</Text> : <View />
        }
        ListEmptyComponent={
          <View style={{ padding: 16 }}>
            <Text style={{ color:'#666' }}>Noch keine Unterhaltungen. Starte eine neue über den Button „Neu“.</Text>
          </View>
        }
      />
    </View>
  );
}
