import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, RefreshControl, ActivityIndicator, Switch } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ChatStackParamList } from '../navigation/types';
import { aiCoach, listConversations, listMessages, Message } from '../data/chatApi';
import { getProfile, getAstroHint, Profile } from '../data/profileApi';
import { listMessagesLocal, insertLocalTempUserMessage, replaceTempWithServerMessage } from '../data/repo/chatLocal';
import { runSync } from '../data/sync';

type Props = NativeStackScreenProps<ChatStackParamList, 'Chat'>;

type UiMsg = { id: string; role: 'user' | 'assistant'; content: string; createdAt?: string };

export default function ChatScreen({ route, navigation }: Props) {
    const initialConvId = route.params?.conversationId ?? null;
    const oldestMsRef = useRef<number | null>(null);

    const [convId, setConvId] = useState<string | null>(initialConvId);
    const [msgs, setMsgs] = useState<UiMsg[]>([]);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [astroOn, setAstroOn] = useState(false);           // 🔹 Toggle im Chat
    const profileRef = useRef<Profile | null>(null);         // 🔹 Profil zwischenspeichern

    const nextCursorRef = useRef<string | null>(null);
    const hasMoreRef = useRef<boolean>(false);
    const loadingMoreRef = useRef<boolean>(false);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                // Erst Sync, dann lokal laden
                await runSync();
                let id = initialConvId;
                if (!id) {
                    // wenn keine convId übergeben wurde, warten wir auf erste Nachricht (Server erzeugt ID)
                    setConvId(null);
                    setMsgs([]); oldestMsRef.current = null;
                    return;
                }
                setConvId(id);
                await loadInitialLocal(id);
            } finally {
                setLoading(false);
            }
        })();
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

    async function loadInitialLocal(conversationId: string) {
        const page = listMessagesLocal(conversationId, 30);
        setMsgs(page.map(m => ({ id: m.id, role: m.role, content: m.content, createdAt: String(m.created_at) })));
        oldestMsRef.current = page.length ? page[0].created_at : null;
    }

    async function loadMoreLocal() {
        if (!convId || !oldestMsRef.current) return;
        const older = listMessagesLocal(convId, 30, oldestMsRef.current);
        if (!older.length) return;
        oldestMsRef.current = older[0].created_at;
        setMsgs(prev => [...older.map(m => ({ id: m.id, role: m.role, content: m.content })), ...prev]);
    }


    function toUi(m: Message): UiMsg {
        return { id: m.id, role: m.role, content: m.content, createdAt: m.createdAt };
    }

    async function send() {
        const prompt = text.trim();
        if (!prompt) return;
        setText('');

        const tempId = `local-${Date.now()}`;
        // optimistic: lokal einfügen
        insertLocalTempUserMessage(tempId, convId, prompt);
        setMsgs(prev => [...prev, { id: tempId, role: 'user', content: prompt }]);

        setSending(true);
        try {
            const res = await aiCoach(prompt, { conversationId: convId ?? undefined, mode: 'coach' });
            // Falls neue Conversation
            if (!convId) {
                setConvId(res.conversationId);
            }
            // temp durch echte User-Message ersetzen (id + timestamps vom Server)
            replaceTempWithServerMessage(tempId, {
                id: res.userMessageId,
                conversationId: convId ?? res.conversationId,
                role: 'user',
                content: prompt,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            // Assistant-Message lokal speichern via Sync (oder direkt hinzufügen):
            await runSync(); // holt neue Server-Messages (inkl. Assistant)
            // alternativ: setMsgs(prev => [...prev, { id: res.assistantMessageId, role:'assistant', content: res.reply }]);
            // Danach Liste aus lokaler DB neu laden:
            if (convId ?? res.conversationId) await loadInitialLocal(convId ?? res.conversationId);
        } catch (e: any) {
            setMsgs(prev => [...prev, { id: `err-${Date.now()}`, role: 'assistant', content: `Fehler: ${e.message ?? 'Unbekannt'}` }]);
        } finally {
            setSending(false);
        }
    }

    function onEndReachedTop(y: number) { if (y < 50) loadMoreLocal(); }

    async function onRefresh() {
        if (!convId) return;
        setRefreshing(true);
        try { await loadInitial(convId); }
        finally { setRefreshing(false); }
    }

    if (loading) {
        return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator /></View>;
    }

    return (
        <View style={{ flex: 1, padding: 16 }}>
            <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Button title="← Liste" onPress={() => navigation.navigate('Conversations')} />
                    <Button title="Neu" onPress={() => { setConvId(null); setMsgs([]); nextCursorRef.current = null; hasMoreRef.current = false; }} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text>Astro</Text>
                    <Switch value={astroOn} onValueChange={setAstroOn} />
                </View>
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
