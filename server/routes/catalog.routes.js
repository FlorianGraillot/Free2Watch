import express from 'express';
import { catalogController } from '../controllers/catalogController.js';
import { optionalAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/home', asyncHandler(catalogController.home));
router.get('/search/suggestions', asyncHandler(catalogController.suggestions));
router.get('/search', asyncHandler(catalogController.search));
router.get(
  '/watch/:contentType(series|tv-shows|anime)/:slug/season/:seasonNumber(\\d+)/episode/:episodeNumber(\\d+)',
  optionalAdmin,
  asyncHandler(catalogController.watchEpisode)
);

export default router;
