import { Request, Response, NextFunction } from 'express';
import { DiscordService } from '../services/discordService';
import { DiscordProfileResponse } from '../types/discord-types';

/**
 * @desc    Get Discord profile information by username
 * @route   GET /api/profile/discord
 * @access  Public
 */
export const getDiscordProfile = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    console.log('=== Discord Profile Request ===');
    console.log('Query params:', req.query);
    
    // Extract username from query parameters
    const { username } = req.query;

    // Validate username parameter
    if (!username || typeof username !== 'string') {
      console.log('❌ Invalid username parameter:', username);
      return res.status(400).json({
        status: 'error',
        message: 'A valid Discord username is required',
      });
    }

    console.log(`🔍 Searching for Discord user: "${username}"`);

    // Create Discord service instance
    const discordService = new DiscordService();
    
    // Fetch user data by username
    try {
      const userData = await discordService.fetchUserDataByUsername(username);

      if (!userData) {
        console.log(`❌ User "${username}" not found`);
        return res.status(404).json({
          status: 'error',
          message: `Discord user with username '${username}' not found`,
          debug: {
            tip: "Make sure the Discord bot is in a server with the user you're looking for",
            checked: "username" // We checked by username
          }
        });
      }

      console.log(`✅ User found: ${userData.username}`);
      
      // Return the response with user data
      const response: DiscordProfileResponse = {
        status: 'success',
        data: userData,
      };

      return res.status(200).json(response);
    } catch (serviceError) {
      console.error('❌ Discord service error:', serviceError);
      const message = serviceError instanceof Error ? serviceError.message : 'Unknown error';
      
      // Check for rate limit error
      if (message.includes('rate limit exceeded')) {
        return res.status(429).json({
          status: 'error',
          message: 'Rate limit exceeded. Please try again later.',
        });
      }
      
      return res.status(500).json({
        status: 'error',
        message: 'Error connecting to Discord API',
        error: message
      });
    }
  } catch (error) {
    console.error('❌ Unhandled error in controller:', error);
    next(error);
  }
}; 