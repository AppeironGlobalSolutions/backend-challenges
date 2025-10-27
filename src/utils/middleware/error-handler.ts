import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../errors/errors';
import logger from '../logger/logger';

/**
 * Express error handler middleware.
 * Converts thrown errors into proper JSON REST responses.
 */
export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        details: err.details,
        statusCode: err.statusCode,
      },
    });
  }

  logger.error('❌ Unexpected error:', err);

  // Default fallback for unhandled errors
  return res.status(500).json({
    error: {
      message: 'Unexpected server error',
      statusCode: 500,
    },
  });
}
