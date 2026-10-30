import express from 'express';
import { createSeasonController } from '../controllers/contentController.js';
import { createEpisodeController } from '../controllers/episodeController.js';
import { optionalAdmin, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Shared season/episode routes for series, TV shows and anime.
 * The URL mirrors the spec: /api/series/:id/seasons/:seasonId/episodes/:episodeId
 */
export function seasonRouter() {
  const router = express.Router();

  const byRouteType = {
    series: {
      season: createSeasonController('series'),
      episode: createEpisodeController('series'),
    },
    'tv-shows': {
      season: createSeasonController('tv_show'),
      episode: createEpisodeController('tv_show'),
    },
    anime: {
      season: createSeasonController('anime'),
      episode: createEpisodeController('anime'),
    },
  };

  const pick = (req) => byRouteType[req.params.contentType];
  const type = '(series|tv-shows|anime)';

  router.get(`/:contentType${type}/:contentId(\\d+)/seasons`, optionalAdmin, (req, res, next) =>
    asyncHandler((request, response) => pick(request).season.list(request, response))(req, res, next)
  );

  router.post(`/:contentType${type}/:contentId(\\d+)/seasons`, requireAdmin, (req, res, next) =>
    asyncHandler((request, response) => pick(request).season.create(request, response))(req, res, next)
  );

  router.put(
    `/:contentType${type}/:contentId(\\d+)/seasons/:seasonId(\\d+)`,
    requireAdmin,
    (req, res, next) =>
      asyncHandler((request, response) => pick(request).season.update(request, response))(req, res, next)
  );

  router.delete(
    `/:contentType${type}/:contentId(\\d+)/seasons/:seasonId(\\d+)`,
    requireAdmin,
    (req, res, next) =>
      asyncHandler((request, response) => pick(request).season.remove(request, response))(req, res, next)
  );

  router.get(
    `/:contentType${type}/:contentId(\\d+)/seasons/:seasonId(\\d+)/episodes`,
    optionalAdmin,
    (req, res, next) =>
      asyncHandler((request, response) => pick(request).episode.list(request, response))(req, res, next)
  );

  router.post(
    `/:contentType${type}/:contentId(\\d+)/seasons/:seasonId(\\d+)/episodes`,
    requireAdmin,
    (req, res, next) =>
      asyncHandler((request, response) => pick(request).episode.create(request, response))(req, res, next)
  );

  router.put(
    `/:contentType${type}/:contentId(\\d+)/seasons/:seasonId(\\d+)/episodes/:episodeId(\\d+)`,
    requireAdmin,
    (req, res, next) =>
      asyncHandler((request, response) => pick(request).episode.update(request, response))(req, res, next)
  );

  router.delete(
    `/:contentType${type}/:contentId(\\d+)/seasons/:seasonId(\\d+)/episodes/:episodeId(\\d+)`,
    requireAdmin,
    (req, res, next) =>
      asyncHandler((request, response) => pick(request).episode.remove(request, response))(req, res, next)
  );

  router.post(
    `/:contentType${type}/:contentId(\\d+)/seasons/:seasonId(\\d+)/episodes/:episodeId(\\d+)/move`,
    requireAdmin,
    (req, res, next) =>
      asyncHandler((request, response) => pick(request).episode.move(request, response))(req, res, next)
  );

  return router;
}
