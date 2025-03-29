import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';

/**
 * @desc    Get list of Discord users the bot can access
 * @route   GET /api/user/list
 * @access  Public
 */
export const getUserList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('=== User List Request ===');
    
    // Create user service instance
    const userService = new UserService();
    
    try {
      // Fetch users from service
      const usersData = await userService.fetchUserList();

      console.log(`✅ Fetched ${usersData.count} users`);
      
      // Return the response
      return res.status(200).json({
        status: 'success',
        data: usersData
      });
    } catch (serviceError) {
      console.error('❌ User service error:', serviceError);
      return res.status(500).json({
        status: 'error',
        message: 'Error fetching Discord users',
        error: serviceError instanceof Error ? serviceError.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('❌ Unhandled error in user controller:', error);
    next(error);
  }
}; 