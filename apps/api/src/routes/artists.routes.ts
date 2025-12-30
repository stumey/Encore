import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../database/prisma';
import { requireAuth } from '../middleware/auth';
import { syncUser } from '../middleware/syncUser';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { geniusService, setlistService } from '../services';

const router = Router();

// GET /artists/search - Search artists (Genius)
router.get(
  '/search',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const query = z.string().min(1).parse(req.query.q);
    const limit = parseInt(req.query.limit as string) || 10;

    const artists = await geniusService.searchArtist(query, limit);

    res.json({ data: artists });
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
