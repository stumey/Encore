import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../database/prisma';
import { requireAuth } from '../middleware/auth';
import { syncUser } from '../middleware/syncUser';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { setlistService } from '../services';
import { Logger } from '../utils/logger';

const router = Router();
const logger = new Logger('VenuesRoutes');

// GET /venues/search - Search venues with cache pull-through
// 1. First check local DB for cached venues
// 2. If found, return those (skip API call)
// 3. If not found, call Setlist.fm and return results
router.get(
  '/search',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const query = z.string().min(1).parse(req.query.q);

    // First, check local database for cached venues
    const localVenues = await prisma.venue.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
      orderBy: { name: 'asc' },
    });

    // If we have local results, return them (cache hit)
    if (localVenues.length > 0) {
      logger.debug('Venue cache hit', { query, count: localVenues.length });
      return res.json({ data: localVenues, source: 'cache' });
    }

    // Cache miss - search Setlist.fm API
    logger.debug('Venue cache miss, searching Setlist.fm', { query });
    try {
      const { venues } = await setlistService.searchVenues(query);

      // Transform to our format (without id - these aren't saved yet)
      const results = venues.map((v) => ({
        id: null, // Not saved to DB yet
        setlistFmId: v.id,
        name: v.name,
        city: v.city?.name || null,
        state: v.city?.state || null,
        country: v.city?.country?.name || null,
      }));

      return res.json({ data: results, source: 'setlistfm' });
    } catch (error) {
      logger.error('Setlist.fm venue search failed, returning empty', { query, error });
      return res.json({ data: [], source: 'error' });
    }
  })
);

// POST /venues/from-setlist - Create or find venue from Setlist.fm selection
router.post(
  '/from-setlist',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const data = z
      .object({
        setlistFmId: z.string(),
        name: z.string(),
        city: z.string().nullable(),
        state: z.string().nullable(),
        country: z.string().nullable(),
      })
      .parse(req.body);

    // Upsert: find by setlistFmId or create
    let venue = await prisma.venue.findUnique({
      where: { setlistFmId: data.setlistFmId },
    });

    if (!venue) {
      venue = await prisma.venue.create({
        data: {
          setlistFmId: data.setlistFmId,
          name: data.name,
          city: data.city,
          state: data.state,
          country: data.country,
        },
      });
      logger.info('Created venue from Setlist.fm', { venueId: venue.id, name: venue.name });
    } else {
      logger.debug('Found existing venue', { venueId: venue.id, name: venue.name });
    }

    res.json({ data: venue });
  })
);

// GET /venues/:id - Venue details with user's concerts there
router.get(
  '/:id',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const venue = await prisma.venue.findUnique({
      where: { id: req.params.id },
      include: {
        concerts: {
          where: { userId: req.user!.userId },
          include: {
            artists: { include: { artist: true } },
          },
          orderBy: { concertDate: 'desc' },
        },
      },
    });

    if (!venue) {
      throw new AppError('Venue not found', 404);
    }

    res.json({ data: venue });
  })
);

// POST /venues - Create venue manually
router.post(
  '/',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const data = z
      .object({
        name: z.string().min(1),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
      })
      .parse(req.body);

    const venue = await prisma.venue.create({ data });

    res.status(201).json({ data: venue });
  })
);

export default router;
