import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { prisma } from '../database/prisma';
import { requireAuth } from '../middleware/auth';
import { syncUser } from '../middleware/syncUser';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { s3Service, mediaAnalysisService, getRetryAfter } from '../services';
import { Logger } from '../utils/logger';

const logger = new Logger('MediaRoutes');
const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────────────────────────────────────

const uploadUrlSchema = z.object({
  contentType: z.string(),
  filename: z.string().optional(),
});

const mediaTypeEnum = z.enum(['photo', 'video']);

const createMediaSchema = z.object({
  mediaType: mediaTypeEnum.default('photo'),
  storagePath: z.string(),
  thumbnailPath: z.string().optional(),
  originalFilename: z.string().optional(),
  duration: z.number().int().positive().optional(),
  takenAt: z.string().transform((s) => new Date(s)).optional(),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
  concertId: z.string().uuid().optional(),
});

const updateMediaSchema = z.object({
  concertId: z.string().uuid().nullable().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────────────────

// POST /media/upload-url - Get presigned upload URL
router.post(
  '/upload-url',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const { contentType } = uploadUrlSchema.parse(req.body);
    const isVideo = contentType.startsWith('video/');
    const ext = contentType.split('/')[1] || (isVideo ? 'mp4' : 'jpg');
    const folder = isVideo ? 'videos' : 'photos';
    const key = `${folder}/${req.user!.userId}/${uuid()}.${ext}`;

    const uploadUrl = await s3Service.generateUploadUrl(key, contentType);

    res.json({
      data: {
        uploadUrl,
        storagePath: key,
        mediaType: isVideo ? 'video' : 'photo',
        expiresIn: 900,
      },
    });
  })
);

// POST /media - Create media record after upload
router.post(
  '/',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const data = createMediaSchema.parse(req.body);

    const media = await prisma.media.create({
      data: {
        ...data,
        userId: req.user!.userId!,
      },
    });

    res.status(201).json({ data: media });
  })
);

// GET /media - List user's media
router.get(
  '/',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const concertId = req.query.concertId as string | undefined;
    const unassigned = req.query.unassigned === 'true';
    // Accept both 'type' and 'mediaType' query params for compatibility
    const mediaType = (req.query.mediaType || req.query.type) as string | undefined;

    const where = {
      userId: req.user!.userId,
      // concertId filter: specific concert > unassigned > all
      ...(concertId ? { concertId } : unassigned ? { concertId: null } : {}),
      ...(mediaType && ['photo', 'video'].includes(mediaType)
        ? { mediaType: mediaType as 'photo' | 'video' }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { concert: { select: { id: true, concertDate: true } } },
      }),
      prisma.media.count({ where }),
    ]);

    const mediaWithUrls = await Promise.all(
      items.map(async (item: typeof items[number]) => ({
        ...item,
        downloadUrl: await s3Service.generateDownloadUrl(item.storagePath),
        thumbnailUrl: item.thumbnailPath
          ? await s3Service.generateDownloadUrl(item.thumbnailPath)
          : null,
      }))
    );

    res.json({
      data: mediaWithUrls,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  })
);

// GET /media/:id - Get single media item with status
router.get(
  '/:id',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const media = await prisma.media.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: { concert: { select: { id: true, concertDate: true } } },
    });

    if (!media) {
      throw new AppError('Media not found', 404);
    }

    const downloadUrl = await s3Service.generateDownloadUrl(media.storagePath);
    const thumbnailUrl = media.thumbnailPath
      ? await s3Service.generateDownloadUrl(media.thumbnailPath)
      : null;

    const retryAfter = media.analysisStatus === 'processing'
      ? getRetryAfter(media.mediaType, media.analysisStartedAt)
      : null;

    res.json({
      data: {
        ...media,
        downloadUrl,
        thumbnailUrl,
        retryAfter,
      },
    });
  })
);

// POST /media/:id/analyze - Trigger AI analysis (fire-and-forget)
router.post(
  '/:id/analyze',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const media = await prisma.media.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });

    if (!media) {
      throw new AppError('Media not found', 404);
    }

    // Don't re-analyze if already processing
    if (media.analysisStatus === 'processing') {
      throw new AppError('Analysis already in progress', 409);
    }

    // Fire and forget - don't await
    mediaAnalysisService.runAnalysis(media.id).catch((err) => {
      logger.error('Background analysis crashed', err as Error, { mediaId: media.id });
    });

    res.json({
      data: {
        id: media.id,
        analysisStatus: 'processing',
        retryAfter: getRetryAfter(media.mediaType, new Date()),
      },
    });
  })
);

// PATCH /media/:id - Update media (reassign concert, etc.)
router.patch(
  '/:id',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const data = updateMediaSchema.parse(req.body);

    const media = await prisma.media.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });

    if (!media) throw new AppError('Media not found', 404);

    // If assigning to a concert, verify ownership
    if (data.concertId) {
      const concert = await prisma.concert.findFirst({
        where: { id: data.concertId, userId: req.user!.userId },
      });
      if (!concert) throw new AppError('Concert not found', 404);
    }

    const updated = await prisma.media.update({
      where: { id: media.id },
      data,
    });

    res.json({ data: updated });
  })
);

// DELETE /media/:id - Delete media
router.delete(
  '/:id',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const media = await prisma.media.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });

    if (!media) {
      throw new AppError('Media not found', 404);
    }

    await s3Service.deleteObject(media.storagePath);
    if (media.thumbnailPath) {
      await s3Service.deleteObject(media.thumbnailPath);
    }

    await prisma.media.delete({ where: { id: media.id } });

    res.status(204).send();
  })
);

export default router;
