import { Request, Response, NextFunction } from 'express';
import { GuildService } from '../services/guildService';

/**
 * @desc    Get guilds that the bot can access
 * @route   GET /api/guild/list
 * @access  Public
 */
export const getGuildList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('=== Guild List Request ===');
    
    // Create guild service instance
    const guildService = new GuildService();
    
    try {
      // Fetch guilds from service
      const guildsData = await guildService.fetchGuildList();

      console.log(`✅ Fetched ${guildsData.guildsCount} guilds`);
      
      // Return the response
      return res.status(200).json({
        status: 'success',
        data: guildsData
      });
    } catch (serviceError) {
      console.error('❌ Guild service error:', serviceError);
      return res.status(500).json({
        status: 'error',
        message: 'Error fetching Discord guilds',
        error: serviceError instanceof Error ? serviceError.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('❌ Unhandled error in guild controller:', error);
    next(error);
  }
}; 