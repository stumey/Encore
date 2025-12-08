import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../database/prisma';
import { requireAuth } from '../middleware/auth';
import { syncUser } from '../middleware/syncUser';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

// GET /venues/search - Search venues
router.get(
  '/search',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const query = z.string().min(1).parse(req.query.q);

    const venues = await prisma.venue.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
      orderBy: { name: 'asc' },
    });

    res.json({ data: venues });
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

// POST /venues - Create venue
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
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        capacity: z.number().int().positive().optional(),
      })
      .parse(req.body);

    const venue = await prisma.venue.create({ data });

    res.status(201).json({ data: venue });
  })
);

export default router;
