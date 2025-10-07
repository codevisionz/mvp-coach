import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('coach.db');

export function migrate() {
  db.withTransactionSync(() => {
    db.execSync(`CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT);`);
    db.execSync(`CREATE TABLE IF NOT EXISTS checkins (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      mood INTEGER NOT NULL,
      note TEXT,
      updated_at INTEGER,
      deleted_at INTEGER
    );`);
    db.execSync(`CREATE TABLE IF NOT EXISTS journals (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      ai_summary TEXT,
      tags TEXT,            -- JSON-String
      updated_at INTEGER,
      deleted_at INTEGER
    );`);
    db.execSync(`CREATE TABLE IF NOT EXISTS outbox (
      id TEXT PRIMARY KEY,
      table_name TEXT NOT NULL,
      op TEXT NOT NULL,         -- 'upsert' | 'delete'
      payload TEXT NOT NULL,
      created_at INTEGER
    );`);
  });
}

