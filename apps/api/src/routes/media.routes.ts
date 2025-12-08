import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { prisma } from '../database/prisma';
import { requireAuth } from '../middleware/auth';
import { syncUser } from '../middleware/syncUser';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { s3Service, claudeService } from '../services';

const router = Router();

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
        key,
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
    const unassigned = req.query.unassigned === 'true';
    const mediaType = req.query.type as string | undefined;

    const where = {
      userId: req.user!.userId,
      ...(unassigned ? { concertId: null } : {}),
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

// POST /media/:id/analyze - Trigger AI analysis
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

    const mediaUrl = await s3Service.generateDownloadUrl(media.storagePath);

    const analysis = await claudeService.analyzePhoto(mediaUrl, {
      takenAt: media.takenAt ?? undefined,
      latitude: media.locationLat ? Number(media.locationLat) : undefined,
      longitude: media.locationLng ? Number(media.locationLng) : undefined,
      originalFilename: media.originalFilename ?? undefined,
    });

    const updated = await prisma.media.update({
      where: { id: media.id },
      data: { aiAnalysis: analysis as object },
    });

    res.json({ data: { media: updated, analysis } });
  })
);

// PATCH /media/:id - Update media (reassign concert, etc.)
router.patch(
  '/:id',
  requireAuth,
  syncUser,
  asyncHandler(async (req, res) => {
    const updateSchema = z.object({
      concertId: z.string().uuid().nullable().optional(),
    });
    const data = updateSchema.parse(req.body);

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
