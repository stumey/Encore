import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { configService } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler';
import routes from './routes';

const app: Express = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS middleware
app.use(
  cors({
    origin: configService.get('CORS_ORIGIN'),
    credentials: true,
  })
);

// Compression middleware
app.use(compression());

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(requestLogger);

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: configService.get('RATE_LIMIT_WINDOW_MS'),
  max: configService.get('RATE_LIMIT_MAX_REQUESTS'),
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use(`/api/${configService.get('API_VERSION')}`, routes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

export default app;
