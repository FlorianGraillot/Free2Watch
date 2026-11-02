import { getDb } from '../database/connection.js';
import { ApiError } from '../utils/ApiError.js';
import { assertParentExists } from './seasonModel.js';

function findSeason(kind, contentId, seasonId) {
  const parent = assertParentExists(kind, contentId);
  const season = getDb()
    .prepare('SELECT * FROM seasons WHERE id = ? AND content_type = ? AND content_id = ?')
    .get(Number(seasonId), kind, parent.id);
  if (!season) throw ApiError.notFound('Season not found');
  return season;
}

function serializeEpisode(row) {
  if (!row) return null;
  const s1 = row.server1_url || row.episode_video || '';
  return {
    ...row,
    episode_video: s1,
    server1_url: s1,
    server2_url: row.server2_url || '',
    server3_url: row.server3_url || '',
  };
}

export const episodeModel = {
  list(kind, contentId, seasonId) {
    const season = findSeason(kind, contentId, seasonId);
    return getDb()
      .prepare('SELECT * FROM episodes WHERE season_id = ? ORDER BY episode_number ASC')
      .all(season.id)
      .map(serializeEpisode);
  },

  findById(kind, contentId, seasonId, episodeId) {
    const season = findSeason(kind, contentId, seasonId);
    const row = getDb()
      .prepare('SELECT * FROM episodes WHERE id = ? AND season_id = ?')
      .get(Number(episodeId), season.id);
    return serializeEpisode(row);
  },

  create(kind, contentId, seasonId, data) {
    const season = findSeason(kind, contentId, seasonId);
    const db = getDb();
    const episodeNumber = Number(data.episode_number);

    if (!Number.isInteger(episodeNumber) || episodeNumber <= 0) {
      throw ApiError.badRequest('Episode number must be a positive integer');
    }
    const duplicate = db
      .prepare('SELECT id FROM episodes WHERE season_id = ? AND episode_number = ?')
      .get(season.id, episodeNumber);
    if (duplicate) throw ApiError.conflict(`Episode ${episodeNumber} already exists in this season`);

    const s1 = String(data.server1_url || data.episode_video || '').trim();
    const s2 = String(data.server2_url || '').trim();
    const s3 = String(data.server3_url || '').trim();

    const info = db
      .prepare(
        `INSERT INTO episodes (season_id, title, episode_number, quality, duration, episode_url, episode_video, server1_url, server2_url, server3_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        season.id,
        String(data.title || `Episode ${episodeNumber}`).trim(),
        episodeNumber,
        data.quality ?? '',
        data.duration ?? '',
        data.episode_url ?? '',
        s1,
        s1,
        s2,
        s3
      );

    return this.findById(kind, contentId, season.id, info.lastInsertRowid);
  },

  update(kind, contentId, seasonId, episodeId, data) {
    const season = findSeason(kind, contentId, seasonId);
    const db = getDb();
    const existing = db
      .prepare('SELECT * FROM episodes WHERE id = ? AND season_id = ?')
      .get(Number(episodeId), season.id);
    if (!existing) throw ApiError.notFound('Episode not found');

    const episodeNumber = Number(data.episode_number ?? existing.episode_number);
    if (!Number.isInteger(episodeNumber) || episodeNumber <= 0) {
      throw ApiError.badRequest('Episode number must be a positive integer');
    }

    const duplicate = db
      .prepare('SELECT id FROM episodes WHERE season_id = ? AND episode_number = ? AND id <> ?')
      .get(season.id, episodeNumber, existing.id);
    if (duplicate) throw ApiError.conflict(`Episode ${episodeNumber} already exists in this season`);

    const s1 = String(
      data.server1_url !== undefined
        ? data.server1_url
        : data.episode_video !== undefined
        ? data.episode_video
        : existing.server1_url || existing.episode_video || ''
    ).trim();
    const s2 = String(
      data.server2_url !== undefined ? data.server2_url : existing.server2_url || ''
    ).trim();
    const s3 = String(
      data.server3_url !== undefined ? data.server3_url : existing.server3_url || ''
    ).trim();

    db.prepare(
      `UPDATE episodes SET title = ?, episode_number = ?, quality = ?, duration = ?,
       episode_url = ?, episode_video = ?, server1_url = ?, server2_url = ?, server3_url = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(
      String(data.title ?? existing.title).trim(),
      episodeNumber,
      data.quality ?? existing.quality ?? '',
      data.duration ?? existing.duration ?? '',
      data.episode_url ?? existing.episode_url ?? '',
      s1,
      s1,
      s2,
      s3,
      existing.id
    );

    return this.findById(kind, contentId, season.id, existing.id);
  },

  remove(kind, contentId, seasonId, episodeId) {
    const season = findSeason(kind, contentId, seasonId);
    const db = getDb();
    const existing = db
      .prepare('SELECT id, title FROM episodes WHERE id = ? AND season_id = ?')
      .get(Number(episodeId), season.id);
    if (!existing) throw ApiError.notFound('Episode not found');

    db.prepare('DELETE FROM episodes WHERE id = ?').run(existing.id);
    return existing;
  },

  /**
   * Swaps an episode with its neighbour by using a temporary episode number,
   * which keeps the UNIQUE(season_id, episode_number) constraint satisfied.
   */
  move(kind, contentId, seasonId, episodeId, direction) {
    const season = findSeason(kind, contentId, seasonId);
    const db = getDb();
    const current = db
      .prepare('SELECT * FROM episodes WHERE id = ? AND season_id = ?')
      .get(Number(episodeId), season.id);
    if (!current) throw ApiError.notFound('Episode not found');

    const neighbour = db
      .prepare(
        `SELECT * FROM episodes
         WHERE season_id = ? AND episode_number ${direction === 'up' ? '<' : '>'} ?
         ORDER BY episode_number ${direction === 'up' ? 'DESC' : 'ASC'}
         LIMIT 1`
      )
      .get(season.id, current.episode_number);

    if (!neighbour) return current;

    const swap = db.transaction(() => {
      const temporary = 100000 + current.id;
      db.prepare('UPDATE episodes SET episode_number = ? WHERE id = ?').run(temporary, current.id);
      db.prepare('UPDATE episodes SET episode_number = ? WHERE id = ?').run(
        current.episode_number,
        neighbour.id
      );
      db.prepare('UPDATE episodes SET episode_number = ? WHERE id = ?').run(
        neighbour.episode_number,
        current.id
      );
    });

    swap();
    return this.findById(kind, contentId, season.id, current.id);
  },

  /** Resolves an episode plus its season and parent content for watch pages. */
  findWithContext(kind, contentSlug, seasonNumber, episodeNumber) {
    const db = getDb();
    const content = db
      .prepare(`SELECT * FROM ${kind === 'movie' ? 'movies' : kind === 'series' ? 'series' : kind === 'tv_show' ? 'tv_shows' : 'anime'} WHERE slug = ?`)
      .get(contentSlug);
    if (!content) return null;

    const season = db
      .prepare('SELECT * FROM seasons WHERE content_type = ? AND content_id = ? AND season_number = ?')
      .get(kind, content.id, Number(seasonNumber));
    if (!season) return null;

    const episode = db
      .prepare('SELECT * FROM episodes WHERE season_id = ? AND episode_number = ?')
      .get(season.id, Number(episodeNumber));
    if (!episode) return null;

    return { content, season, episode: serializeEpisode(episode) };
  },
};
