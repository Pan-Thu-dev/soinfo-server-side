import { Router, RequestHandler, Request, Response } from 'express';
import { getDiscordProfile } from '../controllers/profileController';

const router = Router();

/**
 * @desc    Get Discord profile by username
 * @route   GET /api/profile/discord?username={discordUsername}
 * @access  Public
 */
router.get('/discord', getDiscordProfile as RequestHandler);

/**
 * @desc    Test endpoint to verify the profile route is working
 * @route   GET /api/profile/test
 * @access  Public
 */
router.get('/test', ((req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Profile route is working correctly',
    endpoints: {
      discord: '/api/profile/discord?username={discordUsername}'
    }
  });
}) as RequestHandler);

export default router; 