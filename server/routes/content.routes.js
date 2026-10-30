import express from 'express';
import { createContentController } from '../controllers/contentController.js';
import { optionalAdmin, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/** Mounted at /api/movies, /api/series, /api/tv-shows and /api/anime. */
export function contentRouter(kind) {
  const router = express.Router();
  const controller = createContentController(kind);

  router.get('/facets', optionalAdmin, asyncHandler(controller.facets));
  router.get('/titles', requireAdmin, asyncHandler(controller.titles));
  router.get('/', optionalAdmin, asyncHandler(controller.list));
  router.get('/:id', optionalAdmin, asyncHandler(controller.detail));

  router.post('/', requireAdmin, asyncHandler(controller.create));
  router.put('/:id', requireAdmin, asyncHandler(controller.update));
  router.patch('/:id/status', requireAdmin, asyncHandler(controller.publish));
  router.delete('/:id', requireAdmin, asyncHandler(controller.remove));

  return router;
}
