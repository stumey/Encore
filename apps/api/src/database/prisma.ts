import { PrismaClient } from '@prisma/client';
import { Logger } from '../utils/logger';
import { configService } from '../config/env';

const logger = new Logger('Prisma');

export const prisma = new PrismaClient({
  log: configService.isDevelopment()
    ? [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ]
    : [{ level: 'error', emit: 'stdout' }],
});

// Log queries in development
if (configService.isDevelopment()) {
  prisma.$on('query' as never, (e: { query: string; duration: number }) => {
    logger.logQuery(e.query, e.duration);
  });
}

export async function testConnection(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection successful');
  } catch (error) {
    logger.error('Database connection failed', error as Error);
    throw error;
  }
}

export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}
