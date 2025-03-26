import { Router } from 'express';
import { getDiscordProfile } from '../controllers/profileController';

const router = Router();

/**
 * @route   GET /api/profile/discord
 * @desc    Get Discord profile by URL
 * @access  Public
 */
router.get('/discord', (req, res, next) => getDiscordProfile(req, res, next));

export default router; 