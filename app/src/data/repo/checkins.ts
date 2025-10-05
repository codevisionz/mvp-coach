import { db } from '../db';
import { v4 as uuid } from 'uuid';

export type Mood = 1|2|3|4|5;

export function addLocalCheckIn(input: { date: string; mood: Mood; note?: string }) {
  const id = uuid(); const now = Date.now();
  db.withTransactionSync(() => {
    db.execSync(
      `INSERT INTO checkins (id,date,mood,note,updated_at) VALUES (?,?,?,?,?)`,
      [id, input.date, input.mood, input.note ?? null, now]
    );
    const payload = JSON.stringify({
      id, date: input.date, mood: input.mood, note: input.note ?? null,
      updatedAt: new Date(now).toISOString()
    });
    db.execSync(
      `INSERT INTO outbox (id,table_name,op,payload,created_at) VALUES (?,?,?,?,?)`,
      [id, 'checkins', 'upsert', payload, now]
    );
  });
  return id;
}

export function listLocalCheckIns() {
  return db.getAllSync<{id:string;date:string;mood:number;note:string|null;updated_at:number;deleted_at:number|null}>(
    `SELECT * FROM checkins WHERE deleted_at IS NULL ORDER BY date DESC`
  );
}
