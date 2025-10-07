import { db } from '../db';
import { v4 as uuid } from 'uuid';

export type JournalInput = { text: string; tags?: string[] };

export function addLocalJournal(input: JournalInput) {
  const id = uuid(); const now = Date.now();
  const payload = {
    id,
    text: input.text,
    aiSummary: null as string | null,
    tags: input.tags ?? null,
    updatedAt: new Date(now).toISOString(),
    deletedAt: null as string | null
  };

  db.withTransactionSync(() => {
    db.runSync(
      `INSERT INTO journals (id, text, ai_summary, tags, updated_at, deleted_at)
       VALUES (?,?,?,?,?,?)`,
      [id, input.text, null, input.tags ? JSON.stringify(input.tags) : null, now, null]
    );
    db.runSync(
      `INSERT INTO outbox (id, table_name, op, payload, created_at)
       VALUES (?,?,?,?,?)`,
      [id, 'journals', 'upsert', JSON.stringify(payload), now]
    );
  });

  return id;
}

export function updateLocalJournal(id: string, patch: Partial<JournalInput>) {
  const now = Date.now();
  const row = db.getFirstSync<any>(`SELECT * FROM journals WHERE id=?`, [id]);
  if (!row) return;

  const newText = patch.text ?? row.text;
  const newTags = patch.tags ? JSON.stringify(patch.tags) : row.tags;

  const payload = {
    id,
    text: newText,
    aiSummary: row.ai_summary ?? null,
    tags: newTags ? JSON.parse(newTags) : null,
    updatedAt: new Date(now).toISOString(),
    deletedAt: row.deleted_at ? new Date(row.deleted_at).toISOString() : null
  };

  db.withTransactionSync(() => {
    db.runSync(
      `UPDATE journals SET text=?, tags=?, updated_at=? WHERE id=?`,
      [newText, newTags, now, id]
    );
    db.runSync(
      `INSERT OR REPLACE INTO outbox (id, table_name, op, payload, created_at)
       VALUES (?,?,?,?,?)`,
      [id, 'journals', 'upsert', JSON.stringify(payload), now]
    );
  });
}

export function softDeleteLocalJournal(id: string) {
  const now = Date.now();
  const payload = { table: 'journals', id }; // für /sync/push deletes[]

  db.withTransactionSync(() => {
    db.runSync(`UPDATE journals SET deleted_at=? WHERE id=?`, [now, id]);
    db.runSync(
      `INSERT OR REPLACE INTO outbox (id, table_name, op, payload, created_at)
       VALUES (?,?,?,?,?)`,
      [id, 'journals', 'delete', JSON.stringify(payload), now]
    );
  });
}

export function listLocalJournals() {
  return db.getAllSync<any>(
    `SELECT * FROM journals WHERE deleted_at IS NULL ORDER BY updated_at DESC`
  ).map(r => ({
    ...r,
    tags: r.tags ? JSON.parse(r.tags) : null
  }));
}
