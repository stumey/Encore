import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { configService } from '../config/env';

const LOG_LEVEL = configService.get('LOG_LEVEL');
const NODE_ENV = configService.get('NODE_ENV');
const logsDir = path.join(process.cwd(), 'logs');

/**
 * Custom format for log messages
 * Includes timestamp, level, context, message, and optional metadata
 */
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, context, ...metadata }) => {
    let log = `${timestamp} [${level.toUpperCase()}]`;

    if (context) {
      log += ` [${context}]`;
    }

    log += `: ${message}`;

    if (Object.keys(metadata).length > 0) {
      log += ` ${JSON.stringify(metadata, null, 2)}`;
    }

    return log;
  })
);

/**
 * Console format for development with colors
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, context, ...metadata }) => {
    let log = `${timestamp} [${level}]`;

    if (context) {
      log += ` [${context}]`;
    }

    log += `: ${message}`;

    if (Object.keys(metadata).length > 0) {
      log += ` ${JSON.stringify(metadata, null, 2)}`;
    }

    return log;
  })
);

/**
 * Configure transports based on environment
 */
const transports: winston.transport[] = [];

if (NODE_ENV === 'development') {
  // Console transport for development
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: LOG_LEVEL,
    })
  );
} else if (NODE_ENV === 'production') {
  // File transport with daily rotation for production
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: customFormat,
      level: LOG_LEVEL,
    })
  );

  // Error log file with daily rotation
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
      format: customFormat,
    })
  );
} else if (NODE_ENV === 'test') {
  // Silent transport for test environment
  transports.push(
    new winston.transports.Console({
      silent: true,
    })
  );
}

/**
 * Create Winston logger instance
 */
const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: customFormat,
  defaultMeta: { service: 'encore-api' },
  transports,
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: customFormat,
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: customFormat,
    }),
  ],
});

/**
 * Logger wrapper with context support
 * Allows setting context for better log tracing
 */
export class Logger {
  private context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  setContext(context: string): void {
    this.context = context;
  }

  debug(message: string, metadata?: Record<string, any>): void {
    logger.debug(message, { context: this.context, ...metadata });
  }

  info(message: string, metadata?: Record<string, any>): void {
    logger.info(message, { context: this.context, ...metadata });
  }

  warn(message: string, metadata?: Record<string, any>): void {
    logger.warn(message, { context: this.context, ...metadata });
  }

  error(message: string, error?: Error | Record<string, any>, metadata?: Record<string, any>): void {
    if (error instanceof Error) {
      logger.error(message, {
        context: this.context,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        ...metadata,
      });
    } else {
      logger.error(message, { context: this.context, ...error, ...metadata });
    }
  }

  /**
   * Log HTTP requests
   */
  logRequest(method: string, path: string, statusCode: number, duration: number, metadata?: Record<string, any>): void {
    logger.info(`${method} ${path} ${statusCode}`, {
      context: this.context,
      method,
      path,
      statusCode,
      duration: `${duration}ms`,
      ...metadata,
    });
  }

  /**
   * Log database queries
   */
  logQuery(query: string, duration: number, metadata?: Record<string, any>): void {
    logger.debug(`Database Query`, {
      context: this.context,
      query,
      duration: `${duration}ms`,
      ...metadata,
    });
  }
}

/**
 * Export singleton instance and logger class
 */
export default logger;
