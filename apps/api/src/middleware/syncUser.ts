import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/prisma';
import { AppError } from './errorHandler';
import { Logger } from '../utils/logger';

const logger = new Logger('SyncUser');

/**
 * Middleware to sync authenticated user with database
 * Should be used after requireAuth middleware
 */
export async function syncUser(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.cognitoId || !req.user?.email) {
      throw new AppError('User authentication required', 401);
    }

    const { cognitoId, email } = req.user;

    let dbUser = await prisma.user.findUnique({
      where: { cognitoId },
      select: { id: true, email: true },
    });

    if (!dbUser) {
      logger.info(`Creating new user: ${cognitoId}`);
      dbUser = await prisma.user.create({
        data: { cognitoId, email },
        select: { id: true, email: true },
      });
    } else if (dbUser.email !== email) {
      // Update email if changed in Cognito
      dbUser = await prisma.user.update({
        where: { cognitoId },
        data: { email },
        select: { id: true, email: true },
      });
    }

    req.user.userId = dbUser.id;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      logger.error('Error syncing user', error as Error);
      next(new AppError('Failed to sync user', 500));
    }
  }
}
