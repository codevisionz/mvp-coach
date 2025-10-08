import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ChatStackParamList } from '../navigation/types';
import { aiCoach, listConversations, listMessages, Message } from '../data/chatApi';

type Props = NativeStackScreenProps<ChatStackParamList, 'Chat'>;

type UiMsg = { id: string; role: 'user'|'assistant'; content: string; createdAt?: string };

export default function ChatScreen({ route, navigation }: Props) {
  const initialConvId = route.params?.conversationId ?? null;

  const [convId, setConvId] = useState<string | null>(initialConvId);
  const [msgs, setMsgs] = useState<UiMsg[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const nextCursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef<boolean>(false);
  const loadingMoreRef = useRef<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        let id = initialConvId;
        if (!id) {
          // versuche die neueste Konversation zu laden; falls keine existiert, bleibt null und wir starten neu beim Senden
          const { items } = await listConversations(1,0);
          id = items.length ? items[0].id : null;
        }
        setConvId(id);
        if (id) await loadInitial(id);
      } finally {
        setLoading(false);
      }
    })();
    // re-run wenn Param von Liste kommt
  }, [initialConvId]);

  async function loadInitial(conversationId: string) {
    const r = await listMessages(conversationId, undefined, 30);
    setMsgs(r.items.map(toUi));
    nextCursorRef.current = r.nextCursor;
    hasMoreRef.current = r.hasMore;
  }

  async function loadMore() {
    if (!convId || !hasMoreRef.current || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    try {
      const r = await listMessages(convId, nextCursorRef.current ?? undefined, 30);
      const older = r.items.map(toUi);
      setMsgs(prev => [...older, ...prev]);
      nextCursorRef.current = r.nextCursor;
      hasMoreRef.current = r.hasMore;
    } finally {
      loadingMoreRef.current = false;
    }
  }

  function toUi(m: Message): UiMsg {
    return { id: m.id, role: m.role, content: m.content, createdAt: m.createdAt };
  }

  async function send() {
    const prompt = text.trim();
    if (!prompt) return;
    setText('');
    const tempId = `local-${Date.now()}`;
    setMsgs(prev => [...prev, { id: tempId, role: 'user', content: prompt }]);
    setSending(true);
    try {
      const res = await aiCoach(prompt, { conversationId: convId ?? undefined, mode: 'coach' });
      if (!convId) setConvId(res.conversationId);
      setMsgs(prev => [...prev, { id: res.assistantMessageId, role: 'assistant', content: res.reply }]);
    } catch (e: any) {
      setMsgs(prev => [...prev, { id: `err-${Date.now()}`, role: 'assistant', content: `Fehler: ${e.message ?? 'Unbekannt'}` }]);
    } finally {
      setSending(false);
    }
  }

  async function onRefresh() {
    if (!convId) return;
    setRefreshing(true);
    try { await loadInitial(convId); }
    finally { setRefreshing(false); }
  }

  function onEndReachedTop(offsetY: number) {
    if (offsetY < 50) loadMore();
  }

  if (loading) {
    return <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}><ActivityIndicator /></View>;
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {/* Optional: Header-Buttons */}
      <View style={{ marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button title="← Liste" onPress={() => navigation.navigate('Conversations')} />
        <Button title="Neu" onPress={() => { setConvId(null); setMsgs([]); nextCursorRef.current = null; hasMoreRef.current = false; }} />
      </View>

      <FlatList
        data={msgs}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <View style={{
            alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
            backgroundColor: item.role === 'user' ? '#DCF8C6' : '#EEE',
            padding: 10, borderRadius: 12, marginVertical: 4, maxWidth: '80%'
          }}>
            <Text>{item.content}</Text>
          </View>
        )}
        onScroll={(e) => onEndReachedTop(e.nativeEvent.contentOffset.y)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          hasMoreRef.current
            ? <View style={{ paddingVertical: 8 }}><Button title="Ältere laden" onPress={loadMore} /></View>
            : <View />
        }
      />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          placeholder="Schreib deinem Coach..."
          value={text}
          onChangeText={setText}
          style={{ flex: 1, borderWidth: 1, borderRadius: 8, padding: 10 }}
        />
        <Button title={sending ? '...' : 'Senden'} onPress={send} disabled={sending} />
      </View>
    </View>
  );
}
