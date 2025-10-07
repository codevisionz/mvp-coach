import React, { useEffect, useState } from 'react';
import { View, Text, Button, TextInput, FlatList } from 'react-native';
import { addLocalCheckIn, listLocalCheckIns, Mood } from '../data/repo/checkins';
import { runSync } from '../data/sync';
import { signupOrLogin } from '../utils/auth';
import { useAutoSync } from '../hooks/useAutoSync';

export default function HomeScreen() {
    useAutoSync(60_000);

    const [email, setEmail] = useState('demo@example.com');
    const [pwd, setPwd] = useState('password123');
    const [note, setNote] = useState('');
    const [mood, setMood] = useState<Mood>(3);
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => { }, []);

    function refresh() { setItems(listLocalCheckIns()); }

    async function onAuth() {
        await signupOrLogin(email, pwd);
    }

    async function onSync() {
        await runSync();
        refresh();
    }

    function onAdd() {
        const today = new Date().toISOString().slice(0, 10);
        addLocalCheckIn({ date: today, mood, note });
        setNote('');
        refresh();
    }

    /*return (
        <View style={{ flex: 1, padding: 16, gap: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: '600' }}>Home</Text>
            <Text style={{ color: '#666' }}>Schneller Check-in</Text>

            <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button title="😔" onPress={() => setMood(1)} />
                <Button title="🙁" onPress={() => setMood(2)} />
                <Button title="😐" onPress={() => setMood(3)} />
                <Button title="🙂" onPress={() => setMood(4)} />
                <Button title="😄" onPress={() => setMood(5)} />
            </View>

            <TextInput
                placeholder="Notiz"
                value={note}
                onChangeText={setNote}
                style={{ borderWidth: 1, borderRadius: 8, padding: 8 }}
            />

            <Button
                title="Check-in speichern (offline)"
                onPress={() => onAdd()}
            />
            <Button title="Jetzt synchronisieren" onPress={() => onSync()} />
        </View>
    );*/

    return (
        <View style={{ flex: 1 }}>
            <View style={{ padding: 16, gap: 8 }}>
                <Text style={{ fontSize: 18, fontWeight: '600' }}>MVP Coach (Offline-First)</Text>

                <TextInput placeholder="E-Mail" value={email} onChangeText={setEmail}
                    autoCapitalize="none" style={{ borderWidth: 1, padding: 8, borderRadius: 8 }} />
                <TextInput placeholder="Passwort" value={pwd} onChangeText={setPwd} secureTextEntry
                    style={{ borderWidth: 1, padding: 8, borderRadius: 8 }} />
                <Button title="Login / Signup" onPress={onAuth} />

                <View style={{ height: 12 }} />
                <TextInput placeholder="Notiz" value={note} onChangeText={setNote}
                    style={{ borderWidth: 1, padding: 8, borderRadius: 8 }} />
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
        </View>
    );
}
