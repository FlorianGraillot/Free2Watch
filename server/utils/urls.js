import { ApiError } from './ApiError.js';

const URL_PROTOCOLS = new Set(['http:', 'https:']);

/** Returns true only for absolute http(s) URLs. */
export function isHttpUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const url = new URL(value.trim());
    return URL_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}

/**
 * Normalizes embeddable media URLs and converts common share links
 * (YouTube watch/short links, Vimeo pages) into their iframe equivalents.
 * Returns '' for empty input.
 */
export function normalizeEmbedUrl(value) {
  if (typeof value !== 'string') return '';
  const raw = value.trim();
  if (!raw) return '';

  if (!isHttpUrl(raw)) {
    throw ApiError.badRequest('Media URLs must start with http:// or https://');
  }

  const url = new URL(raw);
  const host = url.hostname.replace(/^www\./, '');

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const videoId = url.searchParams.get('v');
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
  }
  if (host === 'youtu.be') {
    const videoId = url.pathname.split('/').filter(Boolean)[0];
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
  }
  if (host === 'vimeo.com' && /^\/(\d+)/.test(url.pathname)) {
    const videoId = url.pathname.split('/').filter(Boolean)[0];
    return `https://player.vimeo.com/video/${videoId}`;
  }

  return url.toString();
}

/**
 * Validates links used for posters/banners/trailers. `allowImageExtensions`
 * keeps poster validation permissive because CDNs often use query strings.
 */
export function normalizeMediaUrl(value, { field = 'URL', required = false } = {}) {
  if (value === undefined || value === null || String(value).trim() === '') {
    if (required) throw ApiError.badRequest(`${field} is required`);
    return '';
  }
  return normalizeEmbedUrl(String(value));
}
