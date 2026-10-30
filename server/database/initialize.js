import bcrypt from 'bcryptjs';
import { getDb } from './connection.js';
import { runMigrations } from './migrate.js';
import { config } from '../config/env.js';
import { seedReferenceData } from './seedData.js';

/**
 * Bootstraps the database: migrations, the single administrator account and
 * the default category/genre taxonomy. Safe to run on every server start.
 */
export function initializeDatabase() {
  const db = getDb();
  runMigrations();

  ensureAdmin(db);
  seedReferenceData(db);

  return db;
}

function ensureAdmin(db) {
  const existing = db.prepare('SELECT id FROM admins LIMIT 1').get();
  if (existing) {
    // Never reset credentials of an existing administrator on restart.
    return;
  }

  const username = config.adminUsername.trim();
  const passwordHash = bcrypt.hashSync(config.adminPassword, 12);

  db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(
    username,
    passwordHash
  );

  console.log(`[db] created administrator "${username}" (change ADMIN_PASSWORD before deployment)`);
}
