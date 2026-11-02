import { getDb } from '../database/connection.js';
import { getHomeData, getDashboardStats, getRecentContent, searchCatalog } from '../models/catalogModel.js';
import { findContent, parseGenres } from '../models/contentModel.js';
import { ApiError } from '../utils/ApiError.js';

const VALID_KINDS = new Set(['movie', 'series', 'tv_show', 'anime']);

export const catalogController = {
  home(_req, res) {
    res.json(getHomeData());
  },

  search(req, res) {
    const types = String(req.query.types ?? '')
      .split(',')
      .map((type) => type.trim())
      .filter((type) => VALID_KINDS.has(type));

    const result = searchCatalog({
      q: req.query.q || req.query.search,
      types: types.length ? types : undefined,
      category: req.query.category,
      genre: req.query.genre,
      year: req.query.year,
      sort: req.query.sort,
      page: req.query.page,
      limit: req.query.limit,
    });

    res.json(result);
  },

  suggestions(req, res) {
    const q = String(req.query.q ?? '').trim();
    if (q.length < 2) return res.json({ items: [] });

    const result = searchCatalog({ q, limit: 8 });
    res.json({
      items: result.items.map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        poster: item.poster,
        year: item.year,
        content_type: item.content_type,
        route: item.route,
      })),
    });
  },

  /** Public watch resolver: content + season + episodes + prev/next. */
  watchEpisode(req, res) {
    const kindMap = { series: 'series', 'tv-shows': 'tv_show', anime: 'anime' };
    const kind = kindMap[req.params.contentType];
    if (!kind) throw ApiError.badRequest('Invalid content type');

    const content = findContent(kind, req.params.slug, { includeDrafts: Boolean(req.admin) });
    if (!content) throw ApiError.notFound('Title not found');

    const db = getDb();
    const season = db
      .prepare('SELECT * FROM seasons WHERE content_type = ? AND content_id = ? AND season_number = ?')
      .get(kind, content.id, Number(req.params.seasonNumber));
    if (!season) throw ApiError.notFound('Season not found');

    const rawEpisodes = db
      .prepare('SELECT * FROM episodes WHERE season_id = ? ORDER BY episode_number ASC')
      .all(season.id);

    const episodes = rawEpisodes.map((ep) => {
      const s1 = ep.server1_url || ep.episode_video || '';
      return {
        ...ep,
        episode_video: s1,
        server1_url: s1,
        server2_url: ep.server2_url || '',
        server3_url: ep.server3_url || '',
      };
    });

    const index = episodes.findIndex((episode) => episode.episode_number === Number(req.params.episodeNumber));
    if (index === -1) throw ApiError.notFound('Episode not found');

    res.json({
      content,
      season: { ...season, genres: parseGenres(season.genres) },
      episode: episodes[index],
      episodes,
      previous: episodes[index - 1] ?? null,
      next: episodes[index + 1] ?? null,
    });
  },

  dashboardStats(_req, res) {
    res.json(getDashboardStats());
  },

  dashboardRecent(_req, res) {
    res.json(getRecentContent());
  },
};
