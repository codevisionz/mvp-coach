import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('coach.db');

export function migrate() {
  db.withTransactionSync(() => {
    db.execSync(`CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT);`);
    db.execSync(`CREATE TABLE IF NOT EXISTS checkins (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,        -- YYYY-MM-DD
      mood INTEGER NOT NULL,     -- 1..5
      note TEXT,
      updated_at INTEGER,        -- ms epoch
      deleted_at INTEGER
    );`);
    db.execSync(`CREATE TABLE IF NOT EXISTS outbox (
      id TEXT PRIMARY KEY,
      table_name TEXT NOT NULL,  -- 'checkins'
      op TEXT NOT NULL,          -- 'upsert' | 'delete'
      payload TEXT NOT NULL,     -- JSON
      created_at INTEGER
    );`);
  });
}
