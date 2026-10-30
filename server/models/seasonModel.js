import { getDb } from '../database/connection.js';
import { ApiError } from '../utils/ApiError.js';
import { parseGenres, requireContent, EPISODIC_KINDS } from './contentModel.js';

function assertEpisodic(kind) {
  if (!EPISODIC_KINDS.has(kind)) {
    throw ApiError.badRequest('Seasons are only available for series, TV shows and anime');
  }
}

export function assertParentExists(kind, contentId) {
  assertEpisodic(kind);
  // Validates the polymorphic parent against the correct content table.
  return requireContent(kind, contentId, { includeDrafts: true });
}

function serialize(row) {
  if (!row) return null;
  return { ...row, genres: parseGenres(row.genres) };
}

function resolveCategoryId(kind, categoryId) {
  if (categoryId === undefined || categoryId === null || categoryId === '') return null;
  const category = getDb().prepare('SELECT id, content_type FROM categories WHERE id = ?').get(Number(categoryId));
  if (!category) throw ApiError.badRequest('Selected category does not exist');
  if (category.content_type !== kind) {
    throw ApiError.badRequest('Selected category belongs to a different content type');
  }
  return category.id;
}

function resolveGenres(genresInput) {
  const db = getDb();
  const list = parseGenres(genresInput);
  const canonical = [];
  const lookup = db.prepare('SELECT name FROM genres WHERE LOWER(name) = LOWER(?)');

  for (const raw of list) {
    const name = String(raw ?? '').trim();
    if (!name) continue;
    const found = lookup.get(name);
    if (!found) throw ApiError.badRequest(`Unknown genre "${name}"`);
    if (!canonical.includes(found.name)) canonical.push(found.name);
  }

  return canonical;
}

const SEASON_COLUMNS = [
  'title',
  'season_number',
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

function toRecord(kind, data) {
  const record = {};
  for (const column of SEASON_COLUMNS) {
    if (column === 'genres') record.genres = JSON.stringify(resolveGenres(data.genres));
    else if (column === 'category_id') record.category_id = resolveCategoryId(kind, data.category_id);
    else if (column === 'season_number') record.season_number = Number(data.season_number);
    else if (column === 'year') {
      record.year = data.year === '' || data.year === undefined || data.year === null ? null : Number(data.year);
    } else record[column] = data[column] === undefined || data[column] === null ? '' : data[column];
  }
  return record;
}

export const seasonModel = {
  list(kind, contentId, { includeEpisodes = false } = {}) {
    assertParentExists(kind, contentId);
    const db = getDb();

    const seasons = db
      .prepare(
        `SELECT s.*, c.name AS category_name, c.slug AS category_slug,
                (SELECT COUNT(*) FROM episodes e WHERE e.season_id = s.id) AS episode_count
         FROM seasons s
         LEFT JOIN categories c ON c.id = s.category_id
         WHERE s.content_type = ? AND s.content_id = ?
         ORDER BY s.season_number ASC`
      )
      .all(kind, Number(contentId))
      .map(serialize);

    if (includeEpisodes && seasons.length) {
      const episodeStmt = db.prepare(
        'SELECT * FROM episodes WHERE season_id = ? ORDER BY episode_number ASC'
      );
      for (const season of seasons) {
        season.episodes = episodeStmt.all(season.id);
      }
    }

    return seasons;
  },

  findById(kind, seasonId) {
    const row = getDb()
      .prepare('SELECT * FROM seasons WHERE id = ? AND content_type = ?')
      .get(Number(seasonId), kind);
    return serialize(row);
  },

  create(kind, contentId, data) {
    const parent = assertParentExists(kind, contentId);
    const db = getDb();
    const record = toRecord(kind, {
      ...data,
      title: data.title || `Season ${data.season_number}`,
    });

    if (!Number.isInteger(record.season_number) || record.season_number <= 0) {
      throw ApiError.badRequest('Season number must be a positive integer');
    }

    const duplicate = db
      .prepare('SELECT id FROM seasons WHERE content_type = ? AND content_id = ? AND season_number = ?')
      .get(kind, parent.id, record.season_number);
    if (duplicate) throw ApiError.conflict(`Season ${record.season_number} already exists for this title`);

    const columns = ['content_type', 'content_id', ...Object.keys(record)];
    const values = [kind, parent.id, ...Object.keys(record).map((column) => record[column])];

    const info = db
      .prepare(`INSERT INTO seasons (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`)
      .run(...values);

    return this.findById(kind, info.lastInsertRowid);
  },

  update(kind, contentId, seasonId, data) {
    const parent = assertParentExists(kind, contentId);
    const db = getDb();
    const existing = db
      .prepare('SELECT * FROM seasons WHERE id = ? AND content_type = ? AND content_id = ?')
      .get(Number(seasonId), kind, parent.id);
    if (!existing) throw ApiError.notFound('Season not found');

    const merged = {
      ...existing,
      ...data,
      season_number: data.season_number ?? existing.season_number,
      title: data.title ?? existing.title,
    };
    const record = toRecord(kind, merged);

    if (!Number.isInteger(record.season_number) || record.season_number <= 0) {
      throw ApiError.badRequest('Season number must be a positive integer');
    }

    const duplicate = db
      .prepare(
        'SELECT id FROM seasons WHERE content_type = ? AND content_id = ? AND season_number = ? AND id <> ?'
      )
      .get(kind, parent.id, record.season_number, existing.id);
    if (duplicate) throw ApiError.conflict(`Season ${record.season_number} already exists for this title`);

    db.prepare(
      `UPDATE seasons SET ${Object.keys(record).map((column) => `${column} = ?`).join(', ')},
       updated_at = datetime('now') WHERE id = ?`
    ).run(...Object.values(record), existing.id);

    return this.findById(kind, existing.id);
  },

  remove(kind, contentId, seasonId) {
    const parent = assertParentExists(kind, contentId);
    const db = getDb();
    const existing = db
      .prepare('SELECT id, title FROM seasons WHERE id = ? AND content_type = ? AND content_id = ?')
      .get(Number(seasonId), kind, parent.id);
    if (!existing) throw ApiError.notFound('Season not found');

    // Episodes are removed by ON DELETE CASCADE (foreign keys are enabled).
    db.prepare('DELETE FROM seasons WHERE id = ?').run(existing.id);
    return existing;
  },
};
