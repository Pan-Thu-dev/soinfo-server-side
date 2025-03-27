import { Request, Response, NextFunction } from 'express';
import { DiscordService } from '../services/discordService';
import { AppError } from '../utils/appError';

// Initialize Discord service
const discordService = new DiscordService();

/**
 * @desc    Get Discord profile information by URL
 * @route   POST /api/profile
 * @access  Public
 */
export const getDiscordProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { profileUrl } = req.body;

    if (!profileUrl || typeof profileUrl !== 'string') {
      return next(new AppError('Profile URL is required', 400));
    }

    // Validate URL format
    if (!discordService.isValidDiscordUrl(profileUrl)) {
      return next(new AppError('Invalid Discord profile URL', 400));
    }

    // Fetch user data from Discord
    const userData = await discordService.fetchUserData(profileUrl);
    
    if (!userData) {
      return next(new AppError('User not found', 404));
    }

    // Add timestamp for client-side caching
    const responseData = {
      ...userData,
      timestamp: Date.now()
    };

    res.status(200).json(responseData);
  } catch (error) {
    // Check if it's a rate limit error
    if (error instanceof Error && error.message.includes('rate limit')) {
      return next(new AppError('Discord API rate limit reached. Please try again later.', 429));
    }
    next(error);
  }
}; 