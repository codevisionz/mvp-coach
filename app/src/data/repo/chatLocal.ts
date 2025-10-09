import { db } from '../db';

export type LocalConversation = { id: string; mode: string; updated_at: number; deleted_at: number | null };
export type LocalMessage = {
  id: string; conversation_id: string; role: 'user'|'assistant'; content: string;
  created_at: number; updated_at: number; deleted_at: number | null
};

export function upsertConversationFromServer(row: { id:string; mode:string; updatedAt:string; deletedAt?:string|null }) {
  const upd = Date.parse(row.updatedAt);
  const del = row.deletedAt ? Date.parse(row.deletedAt) : null;
  db.runSync(
    `INSERT INTO conversations (id,mode,updated_at,deleted_at)
     VALUES (?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET mode=excluded.mode,updated_at=excluded.updated_at,deleted_at=excluded.deleted_at`,
    [row.id, row.mode, upd, del]
  );
}

export function upsertMessageFromServer(row: { id:string; conversationId:string; role:'user'|'assistant'; content:string; createdAt:string; updatedAt:string; deletedAt?:string|null }) {
  const cre = Date.parse(row.createdAt);
  const upd = Date.parse(row.updatedAt);
  const del = row.deletedAt ? Date.parse(row.deletedAt) : null;
  db.runSync(
    `INSERT INTO messages (id,conversation_id,role,content,created_at,updated_at,deleted_at)
     VALUES (?,?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET
       conversation_id=excluded.conversation_id, role=excluded.role, content=excluded.content,
       created_at=excluded.created_at, updated_at=excluded.updated_at, deleted_at=excluded.deleted_at`,
    [row.id, row.conversationId, row.role, row.content, cre, upd, del]
  );
}

export function listConversationsLocal(limit=20, offset=0): LocalConversation[] {
  return db.getAllSync<LocalConversation>(
    `SELECT * FROM conversations WHERE deleted_at IS NULL ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
}

/** Nachrichten chronologisch (alt → neu). Wenn beforeMs gesetzt, lade ältere (< beforeMs). */
export function listMessagesLocal(conversationId: string, limit=30, beforeMs?: number): LocalMessage[] {
  if (beforeMs) {
    const rows = db.getAllSync<LocalMessage>(
      `SELECT * FROM messages
       WHERE conversation_id=? AND deleted_at IS NULL AND created_at < ?
       ORDER BY created_at DESC LIMIT ?`,
      [conversationId, beforeMs, limit]
    );
    return rows.reverse(); // chronologisch alt → neu
  } else {
    const rows = db.getAllSync<LocalMessage>(
      `SELECT * FROM messages
       WHERE conversation_id=? AND deleted_at IS NULL
       ORDER BY created_at DESC LIMIT ?`,
      [conversationId, limit]
    );
    return rows.reverse();
  }
}

/** Temp-Message (local-123) entfernen, wenn Server-ID vorliegt */
export function replaceTempWithServerMessage(tempId: string, server: { id:string; conversationId:string; role:'user'|'assistant'; content:string; createdAt:string; updatedAt:string }) {
  db.withTransactionSync(() => {
    db.runSync(`DELETE FROM messages WHERE id=?`, [tempId]);
    upsertMessageFromServer(server);
  });
}

/** Lokal direkt einfügen (optimistic UI) */
export function insertLocalTempUserMessage(tempId: string, conversationId: string | null, content: string) {
  const now = Date.now();
  db.runSync(
    `INSERT INTO messages (id,conversation_id,role,content,created_at,updated_at,deleted_at)
     VALUES (?,?,?,?,?,?,NULL)`,
    [tempId, conversationId ?? 'pending', 'user', content, now, now]
  );
}
