import { getDb } from '../database/connection.js';
import { ApiError } from '../utils/ApiError.js';
import { slugify } from '../utils/slugify.js';

const CONTENT_TYPES = ['movie', 'series', 'tv_show', 'anime'];

function serialize(row) {
  return row ? { ...row, item_count: Number(row.item_count ?? 0) } : null;
}

export const categoryModel = {
  list(contentType) {
    const db = getDb();
    const params = [];
    let where = '';

    if (contentType) {
      if (!CONTENT_TYPES.includes(contentType)) throw ApiError.badRequest('Invalid content type');
      where = 'WHERE c.content_type = ?';
      params.push(contentType);
    }

    const rows = db
      .prepare(
        `SELECT c.id, c.name, c.slug, c.content_type, c.created_at, c.updated_at,
                CASE c.content_type
                  WHEN 'movie' THEN (SELECT COUNT(*) FROM movies m WHERE m.category_id = c.id)
                  WHEN 'series' THEN (SELECT COUNT(*) FROM series s WHERE s.category_id = c.id)
                  WHEN 'tv_show' THEN (SELECT COUNT(*) FROM tv_shows s WHERE s.category_id = c.id)
                  WHEN 'anime' THEN (SELECT COUNT(*) FROM anime a WHERE a.category_id = c.id)
                END AS item_count
         FROM categories c
         ${where}
         ORDER BY c.content_type ASC, LOWER(c.name) ASC`
      )
      .all(...params);

    return rows.map(serialize);
  },

  findById(id) {
    return getDb().prepare('SELECT * FROM categories WHERE id = ?').get(Number(id)) ?? null;
  },

  findBySlug(contentType, slug) {
    return (
      getDb()
        .prepare('SELECT * FROM categories WHERE content_type = ? AND slug = ?')
        .get(contentType, slug) ?? null
    );
  },

  create({ name, content_type: contentType, slug }) {
    const cleanName = String(name ?? '').trim();
    if (!cleanName) throw ApiError.badRequest('Category name is required');
    if (cleanName.length > 80) throw ApiError.badRequest('Category name is too long');
    if (!CONTENT_TYPES.includes(contentType)) throw ApiError.badRequest('Invalid content type');

    const db = getDb();
    const finalSlug = slugify(slug || cleanName, 'category');
    const duplicate = db
      .prepare('SELECT id FROM categories WHERE content_type = ? AND slug = ?')
      .get(contentType, finalSlug);
    if (duplicate) throw ApiError.conflict('A category with this name already exists for this content type');

    const info = db
      .prepare('INSERT INTO categories (name, slug, content_type) VALUES (?, ?, ?)')
      .run(cleanName, finalSlug, contentType);

    return this.list().find((category) => category.id === Number(info.lastInsertRowid));
  },

  update(id, { name, content_type: contentType }) {
    const db = getDb();
    const existing = this.findById(id);
    if (!existing) throw ApiError.notFound('Category not found');

    const cleanName = String(name ?? existing.name).trim();
    if (!cleanName) throw ApiError.badRequest('Category name is required');

    const types = [existing.content_type];
    if (contentType && contentType !== existing.content_type) {
      if (!CONTENT_TYPES.includes(contentType)) throw ApiError.badRequest('Invalid content type');
      const usage = this.usageCount(existing.id, existing.content_type);
      if (usage > 0) {
        throw ApiError.conflict('This category is in use. Reassign or delete its content before changing its type.');
      }
      types.push(contentType);
    }
    const finalType = types[types.length - 1];
    const finalSlug = slugify(cleanName, 'category');

    const duplicate = db
      .prepare('SELECT id FROM categories WHERE content_type = ? AND slug = ? AND id <> ?')
      .get(finalType, finalSlug, existing.id);
    if (duplicate) throw ApiError.conflict('A category with this name already exists for this content type');

    db.prepare(
      "UPDATE categories SET name = ?, slug = ?, content_type = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(cleanName, finalSlug, finalType, existing.id);

    return this.list().find((category) => category.id === existing.id);
  },

  usageCount(id, contentType) {
    const db = getDb();
    const table =
      contentType === 'movie'
        ? 'movies'
        : contentType === 'series'
          ? 'series'
          : contentType === 'tv_show'
            ? 'tv_shows'
            : 'anime';

    const own = db.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE category_id = ?`).get(id).count;
    const seasons = db.prepare('SELECT COUNT(*) AS count FROM seasons WHERE category_id = ?').get(id).count;
    return own + seasons;
  },

  remove(id) {
    const existing = this.findById(id);
    if (!existing) throw ApiError.notFound('Category not found');

    const usage = this.usageCount(existing.id, existing.content_type);
    if (usage > 0) {
      throw ApiError.conflict(
        `This category is used by ${usage} item(s). Reassign them to another category before deleting.`
      );
    }

    getDb().prepare('DELETE FROM categories WHERE id = ?').run(existing.id);
    return existing;
  },
};
