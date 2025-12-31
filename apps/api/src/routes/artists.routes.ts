import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../database/prisma';
import { requireAuth } from '../middleware/auth';
import { syncUser } from '../middleware/syncUser';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { geniusService, setlistService } from '../services';
import { Logger } from '../utils/logger';

const router = Router();
const logger = new Logger('ArtistsRoutes');

// GET /artists/search - Search artists with cache pull-through
// 1. First check local DB for cached artists
// 2. If found, return those (skip API call)
// 3. If not found, call Genius and return results
router.get(
  '/search',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const query = z.string().min(1).parse(req.query.q);
    const limit = parseInt(req.query.limit as string) || 10;

    // First, check local database for cached artists
    const localArtists = await prisma.artist.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
      },
      take: limit,
      orderBy: { name: 'asc' },
    });

    // If we have local results, return them (cache hit)
    if (localArtists.length > 0) {
      logger.debug('Artist cache hit', { query, count: localArtists.length });
      return res.json({ data: localArtists, source: 'cache' });
    }

    // Cache miss - search Genius API
    logger.debug('Artist cache miss, searching Genius', { query });
    try {
      const geniusArtists = await geniusService.searchArtist(query, limit);

      // Transform to our format (without id - these aren't saved yet)
      const results = geniusArtists.map((a) => ({
        id: null, // Not saved to DB yet
        geniusId: String(a.id),
        name: a.name,
        imageUrl: a.image_url,
        genres: [],
      }));

      res.json({ data: results, source: 'genius' });
    } catch (error) {
      logger.error('Genius artist search failed, returning empty', { query, error });
      res.json({ data: [], source: 'error' });
    }
  })
);

// POST /artists/from-genius - Create or find artist from Genius selection
router.post(
  '/from-genius',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const data = z
      .object({
        geniusId: z.string(),
        name: z.string(),
        imageUrl: z.string().nullable(),
      })
      .parse(req.body);

    // Upsert: find by geniusId or create
    let artist = await prisma.artist.findUnique({
      where: { geniusId: data.geniusId },
    });

    if (!artist) {
      artist = await prisma.artist.create({
        data: {
          geniusId: data.geniusId,
          name: data.name,
          imageUrl: data.imageUrl,
        },
      });
      logger.info('Created artist from Genius', { artistId: artist.id, name: artist.name });
    } else {
      logger.debug('Found existing artist', { artistId: artist.id, name: artist.name });
    }

    res.json({ data: artist });
  })
);

// POST /artists/batch-from-setlist - Batch create/find artists from Setlist.fm lineup
router.post(
  '/batch-from-setlist',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const { artists } = z
      .object({
        artists: z.array(
          z.object({
            mbid: z.string(),
            name: z.string(),
          })
        ),
      })
      .parse(req.body);

    // Process each artist - find by mbid or create
    const results = await Promise.all(
      artists.map(async (artistData) => {
        let artist = await prisma.artist.findUnique({
          where: { mbid: artistData.mbid },
        });

        if (!artist) {
          artist = await prisma.artist.create({
            data: {
              mbid: artistData.mbid,
              name: artistData.name,
            },
          });
          logger.info('Created artist from Setlist.fm', { artistId: artist.id, name: artist.name });
        }

        return artist;
      })
    );

    res.json({ data: results });
  })
);

// GET /artists/:id - Artist details with user's concerts
router.get(
  '/:id',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const artist = await prisma.artist.findUnique({
      where: { id: req.params.id },
      include: {
        concerts: {
          where: { concert: { userId: req.user!.userId } },
          include: {
            concert: {
              include: { venue: true },
            },
          },
          orderBy: { concert: { concertDate: 'desc' } },
        },
      },
    });

    if (!artist) {
      throw new AppError('Artist not found', 404);
    }

    res.json({ data: artist });
  })
);

// POST /artists - Create or find artist
router.post(
  '/',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const data = z
      .object({
        name: z.string().min(1),
        geniusId: z.string().optional(),
        mbid: z.string().optional(),
        imageUrl: z.string().url().optional(),
        genres: z.array(z.string()).optional(),
      })
      .parse(req.body);

    // Check if artist already exists
    let artist = null;
    if (data.geniusId) {
      artist = await prisma.artist.findUnique({ where: { geniusId: data.geniusId } });
    }
    if (!artist && data.mbid) {
      artist = await prisma.artist.findUnique({ where: { mbid: data.mbid } });
    }

    if (!artist) {
      artist = await prisma.artist.create({ data });
    }

    res.json({ data: artist });
  })
);

// GET /artists/:id/media - Get all user's media from concerts featuring this artist
router.get(
  '/:id/media',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const artist = await prisma.artist.findUnique({
      where: { id: req.params.id },
    });

    if (!artist) {
      throw new AppError('Artist not found', 404);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    // Find all concerts where this artist performed for this user
    const concerts = await prisma.concert.findMany({
      where: {
        userId: req.user!.userId,
        artists: { some: { artistId: artist.id } },
      },
      select: { id: true },
    });

    const concertIds = concerts.map((c) => c.id);

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where: {
          userId: req.user!.userId,
          concertId: { in: concertIds },
        },
        include: {
          concert: {
            select: {
              id: true,
              concertDate: true,
              venue: { select: { name: true, city: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.media.count({
        where: {
          userId: req.user!.userId,
          concertId: { in: concertIds },
        },
      }),
    ]);

    res.json({
      data: media,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  })
);

// GET /artists/:id/setlists - Get artist setlists from Setlist.fm
router.get(
  '/:id/setlists',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const artist = await prisma.artist.findUnique({
      where: { id: req.params.id },
    });

    if (!artist) {
      throw new AppError('Artist not found', 404);
    }

    if (!artist.mbid) {
      // Try to find MBID from Setlist.fm
      const results = await setlistService.searchArtist(artist.name);
      if (results.length > 0) {
        await prisma.artist.update({
          where: { id: artist.id },
          data: { mbid: results[0].mbid },
        });
        artist.mbid = results[0].mbid;
      } else {
        throw new AppError('Could not find artist on Setlist.fm', 404);
      }
    }

    const page = parseInt(req.query.page as string) || 1;
    const setlists = await setlistService.getArtistSetlists(artist.mbid, page);

    res.json({ data: setlists });
  })
);

export default router;
