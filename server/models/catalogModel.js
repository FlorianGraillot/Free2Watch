import { getDb } from '../database/connection.js';
import { serializeRow } from './contentModel.js';

const UNION_SOURCES = [
  { kind: 'movie', table: 'movies', route: 'movie' },
  { kind: 'series', table: 'series', route: 'series' },
  { kind: 'tv_show', table: 'tv_shows', route: 'tv-show' },
  { kind: 'anime', table: 'anime', route: 'anime' },
];

function unionSelect({ includeDrafts }) {
  return UNION_SOURCES.map(
    ({ kind, table, route }) => `
      SELECT t.id, t.title, t.slug, t.poster, t.trailer, t.description, t.story,
             t.genres, t.language, t.country, t.year, t.status, t.created_at,
             '${kind}' AS content_type, '${route}' AS route,
             c.name AS category_name, c.slug AS category_slug
      FROM ${table} t
      LEFT JOIN categories c ON c.id = t.category_id
      ${includeDrafts ? '' : "WHERE t.status = 'published'"}
    `
  ).join(' UNION ALL ');
}

export function searchCatalog(filters = {}) {
  const db = getDb();
  const clauses = [];
  const params = [];

  if (filters.q) {
    clauses.push('(LOWER(title) LIKE ? OR LOWER(COALESCE(description, \'\')) LIKE ?)');
    const needle = `%${String(filters.q).toLowerCase()}%`;
    params.push(needle, needle);
  }
  if (filters.types?.length) {
    clauses.push(`content_type IN (${filters.types.map(() => '?').join(', ')})`);
    params.push(...filters.types);
  }
  if (filters.category) {
    clauses.push('category_slug = ?');
    params.push(filters.category);
  }
  if (filters.genre) {
    clauses.push('EXISTS (SELECT 1 FROM json_each(genres) WHERE LOWER(json_each.value) = LOWER(?))');
    params.push(filters.genre);
  }
  if (filters.year) {
    clauses.push('year = ?');
    params.push(Number(filters.year));
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(60, Math.max(1, Number(filters.limit) || 24));
  const offset = (page - 1) * limit;

  const sortMap = {
    latest: 'created_at DESC, id DESC',
    oldest: 'created_at ASC',
    title: 'LOWER(title) ASC',
    year: 'year DESC',
  };
  const orderBy = sortMap[filters.sort] || sortMap.latest;

  const total = db
    .prepare(`SELECT COUNT(*) AS count FROM (${unionSelect({ includeDrafts: false })}) ${where}`)
    .get(...params).count;

  const rows = db
    .prepare(
      `SELECT * FROM (${unionSelect({ includeDrafts: false })}) ${where}
       ORDER BY ${orderBy} LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset);

  return {
    items: rows.map(serializeRow),
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

function latestByKind(kind, limit = 12) {
  const db = getDb();
  const source = UNION_SOURCES.find((item) => item.kind === kind);
  return db
    .prepare(
      `SELECT t.*, c.name AS category_name, c.slug AS category_slug,
              '${source.kind}' AS content_type, '${source.route}' AS route
       FROM ${source.table} t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.status = 'published'
       ORDER BY t.created_at DESC, t.id DESC
       LIMIT ?`
    )
    .all(limit)
    .map(serializeRow);
}

export function getHomeData() {
  const db = getDb();

  const heroPool = db
    .prepare(
      `SELECT * FROM (${unionSelect({ includeDrafts: false })}) 
       WHERE poster IS NOT NULL AND TRIM(poster) <> ''
       ORDER BY (CASE WHEN trailer IS NOT NULL AND TRIM(trailer) <> '' THEN 1 ELSE 0 END) DESC,
                created_at DESC
       LIMIT 6`
    )
    .all()
    .map(serializeRow);

  const trending = db
    .prepare(
      `SELECT * FROM (${unionSelect({ includeDrafts: false })})
       ORDER BY created_at DESC LIMIT 14`
    )
    .all()
    .map(serializeRow);

  const recommended = db
    .prepare(
      `SELECT * FROM (${unionSelect({ includeDrafts: false })})
       ORDER BY RANDOM() LIMIT 14`
    )
    .all()
    .map(serializeRow);

  const categories = db
    .prepare(
      `SELECT c.id, c.name, c.slug, c.content_type,
              CASE c.content_type
                WHEN 'movie' THEN (SELECT COUNT(*) FROM movies m WHERE m.category_id = c.id AND m.status = 'published')
                WHEN 'series' THEN (SELECT COUNT(*) FROM series s WHERE s.category_id = c.id AND s.status = 'published')
                WHEN 'tv_show' THEN (SELECT COUNT(*) FROM tv_shows t WHERE t.category_id = c.id AND t.status = 'published')
                WHEN 'anime' THEN (SELECT COUNT(*) FROM anime a WHERE a.category_id = c.id AND a.status = 'published')
              END AS item_count
       FROM categories c
       ORDER BY c.content_type, LOWER(c.name)`
    )
    .all()
    .filter((category) => category.item_count > 0);

  return {
    hero: heroPool,
    trending,
    recommended,
    latest: {
      movies: latestByKind('movie'),
      series: latestByKind('series'),
      tvShows: latestByKind('tv_show'),
      anime: latestByKind('anime'),
    },
    categories,
  };
}

export function getDashboardStats() {
  const db = getDb();
  const count = (sql) => db.prepare(sql).get().count;

  const stats = {
    movies: count("SELECT COUNT(*) AS count FROM movies"),
    moviesPublished: count("SELECT COUNT(*) AS count FROM movies WHERE status = 'published'"),
    series: count('SELECT COUNT(*) AS count FROM series'),
    seriesPublished: count("SELECT COUNT(*) AS count FROM series WHERE status = 'published'"),
    tvShows: count('SELECT COUNT(*) AS count FROM tv_shows'),
    tvShowsPublished: count("SELECT COUNT(*) AS count FROM tv_shows WHERE status = 'published'"),
    anime: count('SELECT COUNT(*) AS count FROM anime'),
    animePublished: count("SELECT COUNT(*) AS count FROM anime WHERE status = 'published'"),
    seasons: count('SELECT COUNT(*) AS count FROM seasons'),
    episodes: count('SELECT COUNT(*) AS count FROM episodes'),
    categories: count('SELECT COUNT(*) AS count FROM categories'),
    genres: count('SELECT COUNT(*) AS count FROM genres'),
  };

  const distribution = [
    { type: 'Movies', published: stats.moviesPublished, drafts: stats.movies - stats.moviesPublished },
    { type: 'TV Series', published: stats.seriesPublished, drafts: stats.series - stats.seriesPublished },
    { type: 'TV Shows', published: stats.tvShowsPublished, drafts: stats.tvShows - stats.tvShowsPublished },
    { type: 'Anime', published: stats.animePublished, drafts: stats.anime - stats.animePublished },
  ];

  const categoryBreakdown = db
    .prepare(
      `SELECT c.id, c.name, c.content_type,
              CASE c.content_type
                WHEN 'movie' THEN (SELECT COUNT(*) FROM movies m WHERE m.category_id = c.id)
                WHEN 'series' THEN (SELECT COUNT(*) FROM series s WHERE s.category_id = c.id)
                WHEN 'tv_show' THEN (SELECT COUNT(*) FROM tv_shows t WHERE t.category_id = c.id)
                WHEN 'anime' THEN (SELECT COUNT(*) FROM anime a WHERE a.category_id = c.id)
              END AS item_count
       FROM categories c
       ORDER BY item_count DESC, c.name`
    )
    .all()
    .filter((row) => row.item_count > 0)
    .slice(0, 12);

  return { stats, distribution, categoryBreakdown };
}

export function getRecentContent() {
  const db = getDb();
  const recent = (table) =>
    db
      .prepare(`SELECT id, title, slug, poster, year, status, created_at FROM ${table} ORDER BY created_at DESC LIMIT 5`)
      .all();

  const recentEpisodes = db
    .prepare(
      `SELECT e.id, e.title, e.episode_number, e.created_at,
              s.id AS season_id, s.title AS season_title, s.season_number, s.content_type, s.content_id,
              CASE s.content_type
                WHEN 'series' THEN (SELECT title FROM series WHERE id = s.content_id)
                WHEN 'tv_show' THEN (SELECT title FROM tv_shows WHERE id = s.content_id)
                WHEN 'anime' THEN (SELECT title FROM anime WHERE id = s.content_id)
              END AS parent_title
       FROM episodes e
       JOIN seasons s ON s.id = e.season_id
       ORDER BY e.created_at DESC LIMIT 6`
    )
    .all();

  return {
    movies: recent('movies'),
    series: recent('series'),
    tvShows: recent('tv_shows'),
    anime: recent('anime'),
    episodes: recentEpisodes,
  };
}
