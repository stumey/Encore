import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../database/prisma';
import { requireAuth } from '../middleware/auth';
import { syncUser } from '../middleware/syncUser';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

const updateProfileSchema = z.object({
  username: z.string().max(30).optional().transform(val => {
    if (!val || val.trim() === '') return null; // Empty = clear
    if (val.trim().length < 3) throw new Error('Username must be at least 3 characters');
    return val.trim();
  }),
  displayName: z.string().max(100).optional().transform(val => {
    if (!val || val.trim() === '') return null; // Empty = clear
    return val.trim();
  }),
  avatarUrl: z.string().url().optional(),
  isPublic: z.boolean().optional(),
});

// GET /users/me - Current user profile
router.get(
  '/me',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        avatarUrl: true,
        isPublic: true,
        createdAt: true,
      },
    });
    res.json({ data: user });
  })
);

// PUT /users/me - Update profile
router.put(
  '/me',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const data = updateProfileSchema.parse(req.body);

    // Check username uniqueness
    if (data.username) {
      const existing = await prisma.user.findUnique({
        where: { username: data.username },
      });
      if (existing && existing.id !== req.user!.userId) {
        throw new AppError('Username already taken', 400);
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data,
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        avatarUrl: true,
        isPublic: true,
      },
    });
    res.json({ data: user });
  })
);

// GET /users/me/stats - Concert stats
router.get(
  '/me/stats',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;

    const [totalConcerts, uniqueArtists, uniqueVenues, totalMedia] = await Promise.all([
      prisma.concert.count({ where: { userId } }),
      prisma.concertArtist.findMany({
        where: { concert: { userId } },
        distinct: ['artistId'],
        select: { artistId: true },
      }),
      prisma.concert.findMany({
        where: { userId, venueId: { not: null } },
        distinct: ['venueId'],
        select: { venueId: true },
      }),
      prisma.media.count({ where: { userId } }),
    ]);

    // Get most-seen artist
    const topArtist = await prisma.concertArtist.groupBy({
      by: ['artistId'],
      where: { concert: { userId } },
      _count: { concertId: true },
      orderBy: { _count: { concertId: 'desc' } },
      take: 1,
    });

    let mostSeenArtist = null;
    if (topArtist.length > 0) {
      const artist = await prisma.artist.findUnique({
        where: { id: topArtist[0].artistId },
        select: { id: true, name: true, imageUrl: true },
      });
      mostSeenArtist = {
        artist,
        count: topArtist[0]._count.concertId,
      };
    }

    res.json({
      data: {
        totalConcerts,
        uniqueArtists: uniqueArtists.length,
        uniqueVenues: uniqueVenues.length,
        totalMedia,
        mostSeenArtist,
      },
    });
  })
);

// GET /users/me/artists - Artists seen with concert counts
router.get(
  '/me/artists',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;

    const artistStats = await prisma.concertArtist.groupBy({
      by: ['artistId'],
      where: { concert: { userId } },
      _count: { concertId: true },
    });

    if (artistStats.length === 0) {
      return res.json({ data: [] });
    }

    const artistIds = artistStats.map((s) => s.artistId);
    const artistIdSet = new Set(artistIds);

    // Batch: 2 queries instead of 2×N
    const [artists, concerts] = await Promise.all([
      prisma.artist.findMany({ where: { id: { in: artistIds } } }),
      prisma.concert.findMany({
        where: { userId, artists: { some: { artistId: { in: artistIds } } } },
        select: { concertDate: true, artists: { select: { artistId: true } } },
        orderBy: { concertDate: 'asc' },
      }),
    ]);

    const artistMap = new Map(artists.map((a) => [a.id, a]));

    // Group concert dates by artist (preserves asc order from query)
    const concertsByArtist = new Map<string, Date[]>();
    for (const concert of concerts) {
      for (const ca of concert.artists) {
        if (!artistIdSet.has(ca.artistId)) continue;
        if (!concertsByArtist.has(ca.artistId)) {
          concertsByArtist.set(ca.artistId, []);
        }
        concertsByArtist.get(ca.artistId)!.push(concert.concertDate);
      }
    }

    const artistsWithDetails = artistStats
      .map((stat) => {
        const dates = concertsByArtist.get(stat.artistId) ?? [];
        return {
          artist: artistMap.get(stat.artistId) ?? null,
          concertCount: stat._count.concertId,
          firstSeen: dates[0] ?? null,
          lastSeen: dates[dates.length - 1] ?? null,
        };
      })
      .sort((a, b) => b.concertCount - a.concertCount);

    res.json({ data: artistsWithDetails });
  })
);

// GET /users/:id - Public profile
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isPublic: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.isPublic) {
      throw new AppError('Profile is private', 403);
    }

    res.json({ data: user });
  })
);

export default router;
