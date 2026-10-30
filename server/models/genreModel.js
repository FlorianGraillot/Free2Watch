import { getDb } from '../database/connection.js';
import { ApiError } from '../utils/ApiError.js';
import { slugify } from '../utils/slugify.js';

export const genreModel = {
  list() {
    const db = getDb();
    return db
      .prepare(
        `SELECT g.id, g.name, g.slug, g.created_at, g.updated_at,
          (SELECT COUNT(*) FROM movies m WHERE EXISTS
             (SELECT 1 FROM json_each(m.genres) WHERE LOWER(json_each.value) = LOWER(g.name))) +
          (SELECT COUNT(*) FROM series s WHERE EXISTS
             (SELECT 1 FROM json_each(s.genres) WHERE LOWER(json_each.value) = LOWER(g.name))) +
          (SELECT COUNT(*) FROM tv_shows t WHERE EXISTS
             (SELECT 1 FROM json_each(t.genres) WHERE LOWER(json_each.value) = LOWER(g.name))) +
          (SELECT COUNT(*) FROM anime a WHERE EXISTS
             (SELECT 1 FROM json_each(a.genres) WHERE LOWER(json_each.value) = LOWER(g.name))) AS item_count
         FROM genres g
         ORDER BY LOWER(g.name) ASC`
      )
      .all();
  },

  findById(id) {
    return getDb().prepare('SELECT * FROM genres WHERE id = ?').get(Number(id)) ?? null;
  },

  create({ name }) {
    const cleanName = String(name ?? '').trim();
    if (!cleanName) throw ApiError.badRequest('Genre name is required');
    if (cleanName.length > 60) throw ApiError.badRequest('Genre name is too long');

    const db = getDb();
    const finalSlug = slugify(cleanName, 'genre');
    const duplicate = db.prepare('SELECT id FROM genres WHERE slug = ?').get(finalSlug);
    if (duplicate) throw ApiError.conflict('A genre with this name already exists');

    const info = db.prepare('INSERT INTO genres (name, slug) VALUES (?, ?)').run(cleanName, finalSlug);
    return this.list().find((genre) => genre.id === Number(info.lastInsertRowid));
  },

  update(id, { name }) {
    const db = getDb();
    const existing = this.findById(id);
    if (!existing) throw ApiError.notFound('Genre not found');

    const cleanName = String(name ?? '').trim();
    if (!cleanName) throw ApiError.badRequest('Genre name is required');
    const finalSlug = slugify(cleanName, 'genre');

    const duplicate = db
      .prepare('SELECT id FROM genres WHERE slug = ? AND id <> ?')
      .get(finalSlug, existing.id);
    if (duplicate) throw ApiError.conflict('A genre with this name already exists');

    // Keep the JSON arrays in content rows in sync with the renamed genre.
    const rename = db.transaction(() => {
      for (const table of ['movies', 'series', 'tv_shows', 'anime']) {
        const rows = db
          .prepare(`SELECT id, genres FROM ${table} WHERE genres LIKE ?`)
          .all(`%${existing.name}%`);
        const update = db.prepare(`UPDATE ${table} SET genres = ?, updated_at = datetime('now') WHERE id = ?`);
        for (const row of rows) {
          let genres = [];
          try {
            genres = JSON.parse(row.genres);
          } catch {
            genres = [];
          }
          if (!Array.isArray(genres)) continue;
          const next = genres.map((genre) => (genre === existing.name ? cleanName : genre));
          if (JSON.stringify(next) !== JSON.stringify(genres)) update.run(JSON.stringify(next), row.id);
        }
      }

      db.prepare("UPDATE genres SET name = ?, slug = ?, updated_at = datetime('now') WHERE id = ?").run(
        cleanName,
        finalSlug,
        existing.id
      );
    });

    rename();
    return this.list().find((genre) => genre.id === existing.id);
  },

  remove(id) {
    const existing = this.findById(id);
    if (!existing) throw ApiError.notFound('Genre not found');

    const inUse = this.list().find((genre) => genre.id === existing.id)?.item_count ?? 0;
    if (inUse > 0) {
      throw ApiError.conflict(
        `This genre is assigned to ${inUse} title(s). Remove it from those titles before deleting.`
      );
    }

    getDb().prepare('DELETE FROM genres WHERE id = ?').run(existing.id);
    return existing;
  },
};
