import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { configService } from '../config/env';
import { AppError } from './errorHandler';
import { Logger } from '../utils/logger';

const logger = new Logger('Auth');

interface CognitoTokenPayload {
  sub: string;
  email?: string;
  token_use: 'access' | 'id';
  aud?: string;
  client_id?: string;
  iss: string;
}

const client = jwksClient({
  jwksUri: `https://cognito-idp.${configService.get('COGNITO_REGION')}.amazonaws.com/${configService.get('COGNITO_USER_POOL_ID')}/.well-known/jwks.json`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 36000000, // 10 hours
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback): void {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      logger.error('Failed to get signing key', err);
      return callback(err);
    }
    callback(null, key?.getPublicKey());
  });
}

async function verifyToken(token: string): Promise<CognitoTokenPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        algorithms: ['RS256'],
        issuer: `https://cognito-idp.${configService.get('COGNITO_REGION')}.amazonaws.com/${configService.get('COGNITO_USER_POOL_ID')}`,
      },
      (err, decoded) => {
        if (err) {
          logger.warn('JWT verification failed', { error: err.message });
          return reject(new AppError('Invalid or expired token', 401));
        }

        const payload = decoded as CognitoTokenPayload;

        if (payload.token_use !== 'access' && payload.token_use !== 'id') {
          return reject(new AppError('Invalid token type', 401));
        }

        const clientId = payload.token_use === 'id' ? payload.aud : payload.client_id;
        if (clientId !== configService.get('COGNITO_CLIENT_ID')) {
          return reject(new AppError('Invalid token audience', 401));
        }

        if (!payload.email) {
          return reject(new AppError('Invalid token claims', 401));
        }

        resolve(payload);
      }
    );
  });
}

function extractToken(authHeader: string | undefined): string {
  if (!authHeader) {
    throw new AppError('No authorization header provided', 401);
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new AppError('Invalid authorization header format', 401);
  }

  return parts[1];
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req.headers.authorization);
    const payload = await verifyToken(token);

    req.user = {
      cognitoId: payload.sub,
      email: payload.email!,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      logger.error('Authentication error', error as Error);
      next(new AppError('Authentication failed', 401));
    }
  }
}

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.headers.authorization) {
      return next();
    }

    const token = extractToken(req.headers.authorization);
    const payload = await verifyToken(token);

    req.user = {
      cognitoId: payload.sub,
      email: payload.email!,
    };

    next();
  } catch (error) {
    logger.debug('Optional auth failed', { message: (error as Error).message });
    next();
  }
}
