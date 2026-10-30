import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config/env.js';

let db = null;

/**
 * Returns the singleton better-sqlite3 connection.
 * Foreign keys and WAL mode are enabled for every connection.
 */
export function getDb() {
  if (db) return db;

  fs.mkdirSync(path.dirname(config.databasePath), { recursive: true });

  db = new Database(config.databasePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');

  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
