import bcrypt from 'bcryptjs';
import { getDb } from '../database/connection.js';

export const adminModel = {
  findByUsername(username) {
    return getDb().prepare('SELECT * FROM admins WHERE LOWER(username) = LOWER(?)').get(username);
  },

  findById(id) {
    return getDb().prepare('SELECT id, username, created_at, updated_at FROM admins WHERE id = ?').get(id);
  },

  verifyPassword(plain, hash) {
    return bcrypt.compareSync(plain, hash);
  },

  hashPassword(plain) {
    return bcrypt.hashSync(plain, 12);
  },

  updateCredentials({ id, username, password }) {
    const db = getDb();
    const fields = [];
    const values = [];

    if (username) {
      fields.push('username = ?');
      values.push(username.trim());
    }
    if (password) {
      fields.push('password_hash = ?');
      values.push(this.hashPassword(password));
    }

    if (!fields.length) return this.findById(id);

    db.prepare(
      `UPDATE admins SET ${fields.join(', ')}, updated_at = datetime('now') WHERE id = ?`
    ).run(...values, id);

    return this.findById(id);
  },
};
