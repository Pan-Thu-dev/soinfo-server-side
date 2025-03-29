import { Router, RequestHandler, Request, Response } from 'express';
import { getGuildList } from '../controllers/guildController';

const router = Router();

/**
 * @desc    Get list of guilds the bot can access
 * @route   GET /api/guild/list
 * @access  Public
 */
router.get('/list', getGuildList as RequestHandler);

/**
 * @desc    Test endpoint to verify the guild routes are working
 * @route   GET /api/guild/test
 * @access  Public
 */
router.get('/test', ((req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Guild route is working correctly',
    endpoints: {
      list: '/api/guild/list'
    }
  });
}) as RequestHandler);

export default router; 