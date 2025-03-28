import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Rate limiting middleware to prevent abuse of the API
 * @param maxRequests Maximum requests allowed in the time window
 * @param windowMs Time window in milliseconds
 */
export const rateLimit = (maxRequests = 20, windowMs = 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get client IP
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Check if IP is in store
    const record = rateLimitStore.get(ip);
    
    if (!record) {
      // First request from this IP
      rateLimitStore.set(ip, {
        count: 1,
        resetTime: now + windowMs
      });
      
      // Clean up the record after window expires
      setTimeout(() => {
        rateLimitStore.delete(ip);
      }, windowMs);
      
      return next();
    }
    
    // If reset time has passed, reset the counter
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      
      return next();
    }
    
    // Check if requests exceed limit
    if (record.count >= maxRequests) {
      return next(
        new AppError(
          `Rate limit exceeded. Try again after ${Math.ceil(
            (record.resetTime - now) / 1000
          )} seconds.`,
          429
        )
      );
    }
    
    // Increment request count
    record.count++;
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - record.count).toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString());
    
    next();
  };
}; 