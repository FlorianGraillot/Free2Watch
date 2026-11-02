import { getDb } from '../database/connection.js';
import { ApiError } from '../utils/ApiError.js';
import { uniqueSlug } from '../utils/slugify.js';

export const CONTENT_TABLES = {
  movie: 'movies',
  series: 'series',
  tv_show: 'tv_shows',
  anime: 'anime',
};

export const EPISODIC_KINDS = new Set(['series', 'tv_show', 'anime']);

export const CONTENT_META = {
  movie: { label: 'Movies', singular: 'Movie', route: 'movie' },
  series: { label: 'TV Series', singular: 'TV Series', route: 'series' },
  tv_show: { label: 'TV Shows', singular: 'TV Show', route: 'tv-show' },
  anime: { label: 'Anime', singular: 'Anime', route: 'anime' },
};

export function tableFor(kind) {
  const table = CONTENT_TABLES[kind];
  if (!table) throw ApiError.badRequest(`Unsupported content type "${kind}"`);
  return table;
}

export function parseGenres(value) {
  if (Array.isArray(value)) return value.filter((genre) => typeof genre === 'string' && genre.trim());
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((g) => typeof g === 'string' && g.trim()) : [];
  } catch {
    return [];
  }
}

export function serializeRow(row, kind) {
  if (!row) return null;
  const contentType = row.content_type || kind || null;
  const isMovie = contentType === 'movie' || kind === 'movie';
  const server1 = isMovie ? (row.server1_url || row.movie_video || '') : undefined;
  return {
    ...row,
    content_type: contentType,
    genres: parseGenres(row.genres),
    year: row.year === null || row.year === undefined ? null : Number(row.year),
    ...(isMovie
      ? {
          movie_video: server1,
          server1_url: server1,
          server2_url: row.server2_url || '',
          server3_url: row.server3_url || '',
        }
      : {}),
  };
}

const SORTS = {
  latest: 't.created_at DESC, t.id DESC',
  oldest: 't.created_at ASC, t.id ASC',
  title: 'LOWER(t.title) ASC',
  year: 't.year DESC, t.created_at DESC',
  updated: 't.updated_at DESC',
};

function buildWhere(kind, filters) {
  const table = tableFor(kind);
  const clauses = [];
  const params = [];

  if (filters.status && filters.status !== 'all') {
    clauses.push('t.status = ?');
    params.push(filters.status);
  } else if (!filters.status) {
    clauses.push("t.status = 'published'");
  }

  if (filters.search) {
    clauses.push('(LOWER(t.title) LIKE ? OR LOWER(COALESCE(t.description, \'\')) LIKE ?)');
    const needle = `%${String(filters.search).toLowerCase()}%`;
    params.push(needle, needle);
  }

  if (filters.category) {
    clauses.push('c.slug = ?');
    params.push(filters.category);
  }

  if (filters.categoryId) {
    clauses.push('t.category_id = ?');
    params.push(Number(filters.categoryId));
  }

  if (filters.genre) {
    clauses.push('EXISTS (SELECT 1 FROM json_each(t.genres) WHERE LOWER(json_each.value) = LOWER(?))');
    params.push(filters.genre);
  }

  if (filters.year) {
    clauses.push('t.year = ?');
    params.push(Number(filters.year));
  }

  if (filters.language) {
    clauses.push('LOWER(t.language) = LOWER(?)');
    params.push(filters.language);
  }

  if (filters.country) {
    clauses.push('LOWER(t.country) = LOWER(?)');
    params.push(filters.country);
  }

  if (filters.quality && table === 'movies') {
    clauses.push('LOWER(t.quality) = LOWER(?)');
    params.push(filters.quality);
  }

  return { table, where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

export function listContent(kind, filters = {}) {
  const db = getDb();
  const { table, where, params } = buildWhere(kind, filters);

  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(60, Math.max(1, Number(filters.limit) || 24));
  const offset = (page - 1) * limit;
  const orderBy = SORTS[filters.sort] || SORTS.latest;

  const total = db
    .prepare(
      `SELECT COUNT(*) AS count FROM ${table} t LEFT JOIN categories c ON c.id = t.category_id ${where}`
    )
    .get(...params).count;

  const rows = db
    .prepare(
      `SELECT t.*, '${kind}' AS content_type, '${CONTENT_META[kind].route}' AS route, c.name AS category_name, c.slug AS category_slug
       ${EPISODIC_KINDS.has(kind)
         ? `, (SELECT COUNT(*) FROM seasons s WHERE s.content_type = '${kind}' AND s.content_id = t.id) AS season_count,
              (SELECT COUNT(*) FROM episodes e JOIN seasons s2 ON s2.id = e.season_id
                WHERE s2.content_type = '${kind}' AND s2.content_id = t.id) AS episode_count`
         : ''}
       FROM ${table} t
       LEFT JOIN categories c ON c.id = t.category_id
       ${where}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset);

  return {
    items: rows.map((row) => serializeRow(row, kind)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

/** Distinct filter values used to populate public browse dropdowns. */
export function getContentFacets(kind, { includeDrafts = false } = {}) {
  const db = getDb();
  const table = tableFor(kind);
  const statusWhere = includeDrafts ? '' : "WHERE status = 'published'";

  const distinct = (column) =>
    db
      .prepare(
        `SELECT DISTINCT ${column} AS value FROM ${table}
         ${statusWhere} ${statusWhere ? 'AND' : 'WHERE'} ${column} IS NOT NULL AND TRIM(${column}) <> ''
         ORDER BY ${column} ASC`
      )
      .all()
      .map((row) => row.value);

  const yearRows = db
    .prepare(
      `SELECT DISTINCT year FROM ${table}
       ${statusWhere} ${statusWhere ? 'AND' : 'WHERE'} year IS NOT NULL
       ORDER BY year DESC`
    )
    .all();

  return {
    years: yearRows.map((row) => row.year),
    languages: distinct('language'),
    countries: distinct('country'),
    qualities: table === 'movies' ? distinct('quality') : [],
  };
}

export function findContent(kind, idOrSlug, { includeDrafts = false } = {}) {
  const db = getDb();
  const table = tableFor(kind);
  const isNumeric = /^\d+$/.test(String(idOrSlug));

  const row = db
    .prepare(
      `SELECT t.*, '${kind}' AS content_type, '${CONTENT_META[kind].route}' AS route, c.name AS category_name, c.slug AS category_slug
       FROM ${table} t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.${isNumeric ? 'id' : 'slug'} = ?`
    )
    .get(String(idOrSlug));

  if (!row) return null;
  if (!includeDrafts && row.status !== 'published') return null;
  return serializeRow(row, kind);
}

export function requireContent(kind, idOrSlug, options) {
  const content = findContent(kind, idOrSlug, options);
  if (!content) throw ApiError.notFound(`${CONTENT_META[kind].singular} not found`);
  return content;
}

function resolveCategoryId(kind, categoryId) {
  if (categoryId === undefined || categoryId === null || categoryId === '') return null;
  const db = getDb();
  const category = db.prepare('SELECT id, content_type FROM categories WHERE id = ?').get(Number(categoryId));
  if (!category) throw ApiError.badRequest('Selected category does not exist');
  if (category.content_type !== kind) {
    throw ApiError.badRequest('Selected category belongs to a different content type');
  }
  return category.id;
}

/** Normalizes submitted genre names against the genres table. */
export function resolveGenres(genresInput) {
  const db = getDb();
  const genres = Array.isArray(genresInput) ? genresInput : [];
  const canonical = [];
  const lookup = db.prepare('SELECT name FROM genres WHERE LOWER(name) = LOWER(?)');

  for (const raw of genres) {
    const name = String(raw ?? '').trim();
    if (!name) continue;
    const found = lookup.get(name);
    if (!found) throw ApiError.badRequest(`Unknown genre "${name}"`);
    if (!canonical.includes(found.name)) canonical.push(found.name);
  }

  return canonical;
}

const COMMON_COLUMNS = [
  'title',
  'poster',
  'trailer',
  'description',
  'story',
  'category_id',
  'genres',
  'language',
  'country',
  'year',
];

function columnsFor(kind) {
  return kind === 'movie'
    ? [...COMMON_COLUMNS, 'quality', 'duration', 'movie_video', 'server1_url', 'server2_url', 'server3_url', 'status']
    : [...COMMON_COLUMNS, 'series_url', 'status'];
}

function toRecord(kind, data) {
  const record = {};
  const columns = columnsFor(kind);

  for (const column of columns) {
    if (column === 'genres') {
      record.genres = JSON.stringify(resolveGenres(parseGenres(data.genres)));
    } else if (column === 'category_id') {
      record.category_id = resolveCategoryId(kind, data.category_id);
    } else if (column === 'year') {
      record.year = data.year === '' || data.year === undefined || data.year === null ? null : Number(data.year);
    } else if (column === 'status') {
      record.status = data.status === 'published' ? 'published' : 'draft';
    } else {
      record[column] = data[column] === undefined || data[column] === null ? '' : data[column];
    }
  }

  if (kind === 'movie') {
    const s1 = String(record.server1_url || record.movie_video || '').trim();
    record.server1_url = s1;
    record.movie_video = s1;
    record.server2_url = String(record.server2_url || '').trim();
    record.server3_url = String(record.server3_url || '').trim();
  }

  // Empty media URLs are stored as NULL-friendly empty strings.
  return record;
}

export function createContent(kind, data) {
  const db = getDb();
  const table = tableFor(kind);
  const record = toRecord(kind, data);
  record.slug = uniqueSlug(db, table, data.slug || record.title);

  const columns = Object.keys(record);
  const placeholders = columns.map(() => '?').join(', ');
  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

  const info = db.prepare(sql).run(...columns.map((column) => record[column]));
  return findContent(kind, info.lastInsertRowid, { includeDrafts: true });
}

export function updateContent(kind, id, data) {
  const db = getDb();
  const table = tableFor(kind);
  const existing = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(Number(id));
  if (!existing) throw ApiError.notFound(`${CONTENT_META[kind].singular} not found`);

  const record = toRecord(kind, { ...existing, ...data });
  delete record.slug;
  delete record.title;
  if (Object.prototype.hasOwnProperty.call(data, 'title') && String(data.title).trim()) {
    record.title = String(data.title).trim();
  }
  if (Object.prototype.hasOwnProperty.call(data, 'slug') && data.slug) {
    record.slug = uniqueSlug(db, table, data.slug, existing.id);
  }

  const columns = Object.keys(record);
  if (!columns.length) return findContent(kind, id, { includeDrafts: true });

  const sql = `UPDATE ${table} SET ${columns.map((column) => `${column} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`;
  db.prepare(sql).run(...columns.map((column) => record[column]), existing.id);

  return findContent(kind, existing.id, { includeDrafts: true });
}

/**
 * Deletes content in a transaction. Polymorphic seasons are removed manually
 * because SQLite cannot express a FK across the four content tables.
 */
export function deleteContent(kind, id) {
  const db = getDb();
  const table = tableFor(kind);
  const existing = db.prepare(`SELECT id, title FROM ${table} WHERE id = ?`).get(Number(id));
  if (!existing) throw ApiError.notFound(`${CONTENT_META[kind].singular} not found`);

  const remove = db.transaction(() => {
    if (EPISODIC_KINDS.has(kind)) {
      db.prepare('DELETE FROM seasons WHERE content_type = ? AND content_id = ?').run(kind, existing.id);
    }
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(existing.id);
  });

  remove();
  return { id: existing.id, title: existing.title };
}

/** Lightweight list used by admin pickers ("manage existing title"). */
export function searchTitles(kind, query = '', limit = 30) {
  const db = getDb();
  const table = tableFor(kind);
  const like = `%${String(query).trim().toLowerCase()}%`;

  return db
    .prepare(
      `SELECT t.id, t.title, t.slug, t.status, t.poster, t.year,
              '${kind}' AS content_type, '${CONTENT_META[kind].route}' AS route,
              (SELECT COUNT(*) FROM seasons s WHERE s.content_type = ? AND s.content_id = t.id) AS season_count,
              (SELECT COUNT(*) FROM episodes e JOIN seasons s2 ON s2.id = e.season_id
                WHERE s2.content_type = ? AND s2.content_id = t.id) AS episode_count
       FROM ${table} t
       WHERE LOWER(t.title) LIKE ?
       ORDER BY t.created_at DESC
       LIMIT ?`
    )
    .all(kind, kind, like, Math.min(100, Math.max(1, Number(limit) || 30)))
    .map((row) => serializeRow(row, kind));
}
