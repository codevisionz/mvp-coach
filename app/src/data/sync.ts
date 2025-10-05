import { db } from './db';
import { api } from './api';

function getKV(k: string) {
  const row = db.getFirstSync<{v:string}>(`SELECT v FROM kv WHERE k=?`, [k]);
  return row?.v ?? null;
}
function setKV(k: string, v: string) {
  db.execSync(`INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)`, [k, v]);
}

export async function pushOutbox() {
  const rows = db.getAllSync<any>(`SELECT * FROM outbox ORDER BY created_at ASC`);
  if (!rows.length) return;

  const payload: any = { checkins: [], deletes: [] };
  for (const r of rows) {
    if (r.op === 'upsert' && r.table_name === 'checkins') {
      payload.checkins.push(JSON.parse(r.payload));
    } else if (r.op === 'delete') {
      const body = JSON.parse(r.payload);
      payload.deletes.push(body);
    }
  }

  await api('/sync/push', { method: 'POST', body: JSON.stringify(payload) });
  db.execSync(`DELETE FROM outbox`);
}

export async function pullChanges() {
  const since = getKV('last_sync') ?? '1970-01-01T00:00:00Z';
  const data = await api(`/sync/changes?since=${encodeURIComponent(since)}`);

  let last = since;
  db.withTransactionSync(() => {
    for (const r of (data.checkins as any[] ?? [])) {
      const deletedAtMs = r.deletedAt ? Date.parse(r.deletedAt) : null;
      const updatedAtMs = Date.parse(r.updatedAt);
      db.execSync(
        `INSERT INTO checkins (id,date,mood,note,updated_at,deleted_at)
         VALUES (?,?,?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET
           date=excluded.date,
           mood=excluded.mood,
           note=excluded.note,
           updated_at=excluded.updated_at,
           deleted_at=excluded.deleted_at`,
         [r.id, r.date.slice(0,10), r.mood, r.note ?? null, updatedAtMs, deletedAtMs]
      );
      if (r.updatedAt > last) last = r.updatedAt;
    }
    setKV('last_sync', last);
  });
}

export async function runSync() {
  await pushOutbox();
  await pullChanges();
}
