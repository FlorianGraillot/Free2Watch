import express from 'express';
import authRoutes from './auth.routes.js';
import catalogRoutes from './catalog.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import uploadRoutes from './upload.routes.js';
import { contentRouter } from './content.routes.js';
import { seasonRouter } from './season.routes.js';
import { categoryController } from '../controllers/categoryController.js';
import { genreController } from '../controllers/genreController.js';
import { settingsController } from '../controllers/settingsController.js';
import { communityController } from '../controllers/communityController.js';
import { cinemaController } from '../controllers/cinemaController.js';
import { requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'free2watch-api', time: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/admin/dashboard', dashboardRoutes);
router.use('/uploads', uploadRoutes);

// Seasons + episodes share one router for the three episodic content types.
router.use('/', seasonRouter());

// Public + protected CRUD for the four content types.
router.use('/movies', contentRouter('movie'));
router.use('/series', contentRouter('series'));
router.use('/tv-shows', contentRouter('tv_show'));
router.use('/anime', contentRouter('anime'));

router.use('/', catalogRoutes);

// Categories
router.get('/categories', asyncHandler(categoryController.list));
router.post('/categories', requireAdmin, asyncHandler(categoryController.create));
router.put('/categories/:id', requireAdmin, asyncHandler(categoryController.update));
router.delete('/categories/:id', requireAdmin, asyncHandler(categoryController.remove));

// Genres
router.get('/genres', asyncHandler(genreController.list));
router.post('/genres', requireAdmin, asyncHandler(genreController.create));
router.put('/genres/:id', requireAdmin, asyncHandler(genreController.update));
router.delete('/genres/:id', requireAdmin, asyncHandler(genreController.remove));

// Site settings & Google AdSense
router.get('/settings/adsense', asyncHandler(settingsController.getPublicAdSense));
router.get('/admin/settings/adsense', requireAdmin, asyncHandler(settingsController.getAdminAdSense));
router.put('/admin/settings/adsense', requireAdmin, asyncHandler(settingsController.updateAdSense));

// Community, Reactions & Engagement
router.get('/community/comments/:contentType/:contentId', asyncHandler(communityController.getComments));
router.post('/community/comments', asyncHandler(communityController.addComment));
router.get('/community/reactions/:contentType/:contentId', asyncHandler(communityController.getReactions));
router.post('/community/reactions', asyncHandler(communityController.toggleReaction));
router.post('/community/requests', asyncHandler(communityController.createRequest));
router.post('/community/reports', asyncHandler(communityController.createReport));
router.get('/community/random', asyncHandler(communityController.getRandomTitle));

// Theatrical Releases / Now In Theatres API
router.get('/cinema/in-theatres', asyncHandler(cinemaController.getInTheatres));
router.get('/cinema/movie/:id', asyncHandler(cinemaController.getMovieDetails));

// Admin Community views
router.get('/admin/community/requests', requireAdmin, asyncHandler(communityController.getAdminRequests));
router.get('/admin/community/reports', requireAdmin, asyncHandler(communityController.getAdminReports));

export default router;
