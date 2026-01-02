import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../database/prisma';
import { requireAuth } from '../middleware/auth';
import { syncUser } from '../middleware/syncUser';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

const concertBaseSchema = z.object({
  concertDate: z.string().transform((s) => new Date(s)),
  concertEndDate: z
    .string()
    .transform((s) => new Date(s))
    .optional(),
  venueId: z.string().uuid().optional(),
  tourName: z.string().optional(),
  notes: z.string().optional(),
  artists: z
    .array(
      z.object({
        artistId: z.string().uuid(),
        isHeadliner: z.boolean().default(false),
        setOrder: z.number().optional(),
      })
    )
    .optional(),
});

const createConcertSchema = concertBaseSchema.refine(
  (data) => {
    if (!data.concertEndDate) return true;
    return data.concertEndDate >= data.concertDate;
  },
  { message: 'End date must be on or after start date', path: ['concertEndDate'] }
);

const updateConcertSchema = concertBaseSchema.partial().refine(
  (data) => {
    if (!data.concertDate || !data.concertEndDate) return true;
    return data.concertEndDate >= data.concertDate;
  },
  { message: 'End date must be on or after start date', path: ['concertEndDate'] }
);

// GET /concerts - List user's concerts
router.get(
  '/',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [concerts, total] = await Promise.all([
      prisma.concert.findMany({
        where: { userId: req.user!.userId },
        orderBy: { concertDate: 'desc' },
        skip,
        take: limit,
        include: {
          venue: true,
          artists: {
            include: { artist: true },
            orderBy: { setOrder: 'asc' },
          },
          _count: { select: { media: true } },
        },
      }),
      prisma.concert.count({ where: { userId: req.user!.userId } }),
    ]);

    res.json({
      data: concerts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  })
);

// GET /concerts/:id - Single concert
router.get(
  '/:id',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const concert = await prisma.concert.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: {
        venue: true,
        artists: {
          include: { artist: true },
          orderBy: { setOrder: 'asc' },
        },
        media: { orderBy: { createdAt: 'desc' } },
        setlist: true,
      },
    });

    if (!concert) {
      throw new AppError('Concert not found', 404);
    }

    res.json({ data: concert });
  })
);

// POST /concerts - Create concert
router.post(
  '/',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const { artists, ...data } = createConcertSchema.parse(req.body);

    const concert = await prisma.concert.create({
      data: {
        ...data,
        userId: req.user!.userId!,
        artists: artists
          ? {
              create: artists.map((a) => ({
                artistId: a.artistId,
                isHeadliner: a.isHeadliner,
                setOrder: a.setOrder,
              })),
            }
          : undefined,
      },
      include: {
        venue: true,
        artists: { include: { artist: true } },
      },
    });

    res.status(201).json({ data: concert });
  })
);

// PUT /concerts/:id - Update concert
router.put(
  '/:id',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const existing = await prisma.concert.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });

    if (!existing) {
      throw new AppError('Concert not found', 404);
    }

    const { artists, ...data } = updateConcertSchema.parse(req.body);

    const concert = await prisma.concert.update({
      where: { id: req.params.id },
      data,
      include: {
        venue: true,
        artists: { include: { artist: true } },
      },
    });

    res.json({ data: concert });
  })
);

// DELETE /concerts/:id - Delete concert
router.delete(
  '/:id',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const existing = await prisma.concert.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });

    if (!existing) {
      throw new AppError('Concert not found', 404);
    }

    await prisma.concert.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

// POST /concerts/:id/artists - Add artists to an existing concert
router.post(
  '/:id/artists',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const { artists } = z
      .object({
        artists: z.array(
          z.object({
            artistId: z.string().uuid(),
            isHeadliner: z.boolean().default(false),
            setOrder: z.number().optional(),
          })
        ),
      })
      .parse(req.body);

    // Verify ownership
    const concert = await prisma.concert.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });

    if (!concert) {
      throw new AppError('Concert not found', 404);
    }

    // Get existing artist count for setOrder
    const existingCount = await prisma.concertArtist.count({
      where: { concertId: concert.id },
    });

    // Add new artists (skip duplicates)
    await prisma.concertArtist.createMany({
      data: artists.map((a, i) => ({
        concertId: concert.id,
        artistId: a.artistId,
        isHeadliner: a.isHeadliner,
        setOrder: a.setOrder ?? existingCount + i + 1,
      })),
      skipDuplicates: true,
    });

    // Return updated concert
    const updated = await prisma.concert.findUnique({
      where: { id: concert.id },
      include: {
        venue: true,
        artists: {
          include: { artist: true },
          orderBy: { setOrder: 'asc' },
        },
      },
    });

    res.json({ data: updated });
  })
);

// POST /concerts/:id/verify - Mark as verified
router.post(
  '/:id/verify',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const concert = await prisma.concert.updateMany({
      where: { id: req.params.id, userId: req.user!.userId },
      data: { isVerified: true },
    });

    if (concert.count === 0) {
      throw new AppError('Concert not found', 404);
    }

    res.json({ message: 'Concert verified' });
  })
);

export default router;
