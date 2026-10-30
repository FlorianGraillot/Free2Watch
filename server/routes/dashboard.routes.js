import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { catalogController } from '../controllers/catalogController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.use(requireAdmin);

router.get('/stats', asyncHandler(catalogController.dashboardStats));
router.get('/recent-content', asyncHandler(catalogController.dashboardRecent));

export default router;
