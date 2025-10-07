import { db } from './db';
import { api } from './api';

function getKV(k: string) {
  const row = db.getFirstSync<{v:string}>(`SELECT v FROM kv WHERE k=?`, [k]);
  return row?.v ?? null;
}
function setKV(k: string, v: string) {
  db.runSync(`INSERT OR REPLACE INTO kv (k,v) VALUES (?,?)`, [k, v]);
}

export async function pushOutbox() {
  const rows = db.getAllSync<any>(`SELECT * FROM outbox ORDER BY created_at ASC`);
  if (!rows.length) return;

  const payload: any = { checkins: [], journals: [], deletes: [] };

  for (const r of rows) {
    if (r.op === 'upsert') {
      const obj = JSON.parse(r.payload);
      if (r.table_name === 'checkins') payload.checkins.push(obj);
      if (r.table_name === 'journals') payload.journals.push(obj);
    } else if (r.op === 'delete') {
      payload.deletes.push(JSON.parse(r.payload)); // { table, id }
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
    // Checkins
    for (const r of (data.checkins as any[] ?? [])) {
      const delMs = r.deletedAt ? Date.parse(r.deletedAt) : null;
      const updMs = Date.parse(r.updatedAt);
      db.runSync(
        `INSERT INTO checkins (id,date,mood,note,updated_at,deleted_at)
         VALUES (?,?,?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET
          date=excluded.date, mood=excluded.mood, note=excluded.note,
          updated_at=excluded.updated_at, deleted_at=excluded.deleted_at`,
        [r.id, r.date.slice(0,10), r.mood, r.note ?? null, updMs, delMs]
      );
      if (r.updatedAt > last) last = r.updatedAt;
    }

    // Journals
    for (const r of (data.journals as any[] ?? [])) {
      const delMs = r.deletedAt ? Date.parse(r.deletedAt) : null;
      const updMs = Date.parse(r.updatedAt);
      db.runSync(
        `INSERT INTO journals (id,text,ai_summary,tags,updated_at,deleted_at)
         VALUES (?,?,?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET
           text=excluded.text, ai_summary=excluded.ai_summary, tags=excluded.tags,
           updated_at=excluded.updated_at, deleted_at=excluded.deleted_at`,
        [
          r.id,
          r.text,
          r.aiSummary ?? null,
          r.tags ? JSON.stringify(r.tags) : null,
          updMs,
          delMs
        ]
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
