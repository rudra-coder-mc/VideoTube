
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

// Enhanced error handling middleware
const errorHandler = (err: ApiError, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log the error (can use a logging library like Winston or Bunyan for more advanced logging)
  console.error(`[Error] ${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  // Differentiate responses for development and production
  if (process.env.NODE_ENV === 'development') {
    // In development, send the stack trace and detailed message
    res.status(statusCode).json({
      status: 'error',
      statusCode,
      message,
      stack: err.stack, // Include stack trace for debugging
    });
  } else {
    // In production, avoid leaking stack trace details
    res.status(statusCode).json({
      status: 'error',
      statusCode,
      message: statusCode === 500 ? 'Internal Server Error' : message, // Generalize message for server errors
    });
  }
};


export default errorHandler

// Usage: This should be used after all other routes and middlewares
