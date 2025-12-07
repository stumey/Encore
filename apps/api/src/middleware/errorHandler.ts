import { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express';
import { Logger } from '../utils/logger';
import { configService } from '../config/env';

const logger = new Logger('ErrorHandler');

/**
 * Custom application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Async error handler wrapper for route handlers
 */
export const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    statusCode: 404,
  });
};

/**
 * Global error handler middleware
 */
export const globalErrorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isDevelopment = configService.isDevelopment();

  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error) {
    message = err.message;
  }

  logger.error(`[${req.method}] ${req.originalUrl}`, err);

  const response: Record<string, unknown> = {
    success: false,
    message: statusCode === 500 && !isDevelopment ? 'Internal Server Error' : message,
    statusCode,
  };

  if (isDevelopment && err instanceof Error) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
