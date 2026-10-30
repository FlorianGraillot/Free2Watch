import express from 'express';
import { authController } from '../controllers/authController.js';
import { requireAdmin } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimit.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.post('/login', loginLimiter, asyncHandler(authController.login));
router.post('/logout', asyncHandler(authController.logout));
router.get('/me', requireAdmin, asyncHandler(authController.me));
router.put('/credentials', requireAdmin, asyncHandler(authController.updateCredentials));

export default router;
