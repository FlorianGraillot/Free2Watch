/**
 * Destructive helper: removes the SQLite database (and WAL files), then
 * recreates an empty schema with the default administrator + taxonomy.
 * Usage: npm run db:reset -- --yes
 */
import fs from 'node:fs';
import { config } from '../config/env.js';
import { initializeDatabase } from '../database/initialize.js';
import { closeDb } from '../database/connection.js';

if (!process.argv.includes('--yes')) {
  console.error('Refusing to reset the database without --yes.');
  process.exit(1);
}

for (const suffix of ['', '-wal', '-shm']) {
  const file = `${config.databasePath}${suffix}`;
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`[reset] removed ${file}`);
  }
}

initializeDatabase();
closeDb();
console.log('[reset] database recreated with default admin and taxonomy.');
