import { Router } from 'express';
import { getDiscordProfile } from '../controllers/profileController';

const router = Router();

/**
 * @route   POST /api/profile
 * @desc    Get Discord profile by URL
 * @access  Public
 */
router.post('/', (req, res, next) => getDiscordProfile(req, res, next));

export default router; 