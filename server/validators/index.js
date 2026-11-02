import { ApiError } from '../utils/ApiError.js';
import { normalizeMediaUrl } from '../utils/urls.js';

const STATUSES = new Set(['published', 'draft']);

function text(value, field, { required = false, max = 5000 } = {}) {
  const clean = value === undefined || value === null ? '' : String(value).trim();
  if (required && !clean) throw ApiError.badRequest(`${field} is required`, { field });
  if (clean.length > max) throw ApiError.badRequest(`${field} must be ${max} characters or fewer`, { field });
  return clean;
}

function url(value, field, { image = false } = {}) {
  const clean = value === undefined || value === null ? '' : String(value).trim();
  if (!clean) return '';
  if (image && clean.startsWith('/')) return clean;
  try {
    return normalizeMediaUrl(clean, { field });
  } catch {
    throw ApiError.badRequest(`${field} must be a valid http(s) URL`, { field });
  }
}

function year(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  const maxYear = new Date().getFullYear() + 5;
  if (!Number.isInteger(parsed) || parsed < 1888 || parsed > maxYear) {
    throw ApiError.badRequest(`Release year must be between 1888 and ${maxYear}`, { field: 'year' });
  }
  return parsed;
}

function status(value, { required = false } = {}) {
  if (value === undefined || value === '') {
    if (required) throw ApiError.badRequest('Status is required', { field: 'status' });
    return 'draft';
  }
  if (!STATUSES.has(value)) throw ApiError.badRequest('Status must be "published" or "draft"', { field: 'status' });
  return value;
}

function genres(value) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw ApiError.badRequest('Genres must be an array of names', { field: 'genres' });
  if (value.length > 20) throw ApiError.badRequest('A maximum of 20 genres is allowed', { field: 'genres' });
  return value.map((genre) => text(genre, 'Genre name', { max: 60 })).filter(Boolean);
}

function categoryId(value) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw ApiError.badRequest('Category is invalid', { field: 'category_id' });
  }
  return parsed;
}

/** Validates a movie / series / tv show / anime payload. */
export function validateContent(kind, body, { partial = false } = {}) {
  if (!body || typeof body !== 'object') throw ApiError.badRequest('A request body is required');

  const payload = {};
  const title = text(body.title, 'Title', { required: !partial, max: 200 });
  if (title) payload.title = title;

  if (body.poster !== undefined) payload.poster = url(body.poster, 'Poster URL', { image: true });
  if (body.trailer !== undefined) payload.trailer = url(body.trailer, 'Trailer URL');
  if (body.description !== undefined) payload.description = text(body.description, 'Description', { max: 2000 });
  if (body.story !== undefined) payload.story = text(body.story, 'Story', { max: 10000 });
  if (body.category_id !== undefined || body.category !== undefined) {
    payload.category_id = categoryId(body.category_id ?? body.category);
  }
  if (body.genres !== undefined) payload.genres = genres(body.genres);
  if (body.language !== undefined) payload.language = text(body.language, 'Language', { max: 60 });
  if (body.country !== undefined) payload.country = text(body.country, 'Country', { max: 60 });
  if (body.year !== undefined) payload.year = year(body.year);
  if (body.status !== undefined) payload.status = status(body.status, { required: !partial });

  if (kind === 'movie') {
    if (body.quality !== undefined) payload.quality = text(body.quality, 'Quality', { max: 40 });
    if (body.duration !== undefined) payload.duration = text(body.duration, 'Duration', { max: 40 });
    if (body.movie_video !== undefined) payload.movie_video = url(body.movie_video, 'Movie video URL');
    if (body.server1_url !== undefined) payload.server1_url = url(body.server1_url, 'Server 1 URL');
    if (body.server2_url !== undefined) payload.server2_url = url(body.server2_url, 'Server 2 URL');
    if (body.server3_url !== undefined) payload.server3_url = url(body.server3_url, 'Server 3 URL');
  } else if (body.series_url !== undefined) {
    payload.series_url = url(body.series_url, 'Series URL');
  }

  if (partial && !Object.keys(payload).length) {
    throw ApiError.badRequest('No valid fields were provided');
  }

  return payload;
}

export function validateSeason(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object') throw ApiError.badRequest('A request body is required');

  const payload = {};
  if (body.title !== undefined) payload.title = text(body.title, 'Season title', { max: 120 });
  if (body.season_number !== undefined || body.seasonNumber !== undefined) {
    const value = Number(body.season_number ?? body.seasonNumber);
    if (!Number.isInteger(value) || value <= 0) {
      throw ApiError.badRequest('Season number must be a positive integer', { field: 'season_number' });
    }
    payload.season_number = value;
  } else if (!partial) {
    throw ApiError.badRequest('Season number is required', { field: 'season_number' });
  }

  if (body.poster !== undefined) payload.poster = url(body.poster, 'Poster URL', { image: true });
  if (body.trailer !== undefined) payload.trailer = url(body.trailer, 'Trailer URL');
  if (body.description !== undefined) payload.description = text(body.description, 'Description', { max: 2000 });
  if (body.story !== undefined) payload.story = text(body.story, 'Story', { max: 10000 });
  if (body.category_id !== undefined) payload.category_id = categoryId(body.category_id);
  if (body.genres !== undefined) payload.genres = genres(body.genres);
  if (body.language !== undefined) payload.language = text(body.language, 'Language', { max: 60 });
  if (body.country !== undefined) payload.country = text(body.country, 'Country', { max: 60 });
  if (body.year !== undefined) payload.year = year(body.year);

  return payload;
}

export function validateEpisode(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object') throw ApiError.badRequest('A request body is required');

  const payload = {};
  if (body.title !== undefined) payload.title = text(body.title, 'Episode title', { max: 200 });
  if (body.episode_number !== undefined || body.episodeNumber !== undefined) {
    const value = Number(body.episode_number ?? body.episodeNumber);
    if (!Number.isInteger(value) || value <= 0) {
      throw ApiError.badRequest('Episode number must be a positive integer', { field: 'episode_number' });
    }
    payload.episode_number = value;
  } else if (!partial) {
    throw ApiError.badRequest('Episode number is required', { field: 'episode_number' });
  }

  if (body.quality !== undefined) payload.quality = text(body.quality, 'Quality', { max: 40 });
  if (body.duration !== undefined) payload.duration = text(body.duration, 'Duration', { max: 40 });
  if (body.episode_url !== undefined) payload.episode_url = url(body.episode_url, 'Episode URL');
  if (body.episode_video !== undefined) payload.episode_video = url(body.episode_video, 'Episode video URL');
  if (body.server1_url !== undefined) payload.server1_url = url(body.server1_url, 'Server 1 URL');
  if (body.server2_url !== undefined) payload.server2_url = url(body.server2_url, 'Server 2 URL');
  if (body.server3_url !== undefined) payload.server3_url = url(body.server3_url, 'Server 3 URL');

  return payload;
}

export function validateCategory(body) {
  const name = text(body?.name, 'Category name', { required: true, max: 80 });
  const contentTypes = ['movie', 'series', 'tv_show', 'anime'];
  const contentType = String(body?.content_type ?? '').trim();
  if (!contentTypes.includes(contentType)) {
    throw ApiError.badRequest('Select a valid content type', { field: 'content_type' });
  }
  return { name, content_type: contentType };
}

export function validateGenre(body) {
  return { name: text(body?.name, 'Genre name', { required: true, max: 60 }) };
}

export function validateCredentials(body) {
  const username = text(body?.username, 'Username', { required: true, max: 40 });
  const password = text(body?.password, 'Password', { required: true, max: 200 });
  if (password.length < 3) throw ApiError.badRequest('Password is too short', { field: 'password' });
  return { username, password };
}
