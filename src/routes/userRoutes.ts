import { Router, RequestHandler, Request, Response } from 'express';
import { getUserList } from '../controllers/userController';

const router = Router();

/**
 * @desc    Get list of users the bot can access
 * @route   GET /api/user/list
 * @access  Public
 */
router.get('/list', getUserList as RequestHandler);

/**
 * @desc    Test endpoint to verify the user routes are working
 * @route   GET /api/user/test
 * @access  Public
 */
router.get('/test', ((req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'User route is working correctly',
    endpoints: {
      list: '/api/user/list'
    }
  });
}) as RequestHandler);

export default router; 