import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';

/**
 * Global error handler middleware
 * Handles all errors and sends appropriate responses
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default error values
  let statusCode = 500;
  let status = 'error';
  let message = 'Something went wrong';
  let stack: string | undefined;

  // If it's our custom AppError
  if ('statusCode' in err) {
    statusCode = err.statusCode;
    status = err.status;
    message = err.message;
  } else {
    // For standard Error objects
    message = err.message || 'Internal Server Error';
  }

  // Include stack trace in development environment
  if (process.env.NODE_ENV === 'development') {
    stack = err.stack;
  }

  // Send the error response
  res.status(statusCode).json({
    status,
    message,
    ...(stack && { stack }),
  });
}; 