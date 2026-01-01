import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { prisma } from '../database/prisma';
import { requireAuth } from '../middleware/auth';
import { syncUser } from '../middleware/syncUser';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { s3Service, claudeService, exifService, setlistService, ffmpegService } from '../services';
import { Logger } from '../utils/logger';

const logger = new Logger('MediaRoutes');

const router = Router();

/**
 * Run media analysis in background (fire-and-forget)
 * Combines EXIF metadata, Setlist.fm lookup, and Claude visual analysis
 */
async function runAnalysisInBackground(mediaId: string): Promise<void> {
  try {
    const media = await prisma.media.update({
      where: { id: mediaId },
      data: {
        analysisStatus: 'processing',
        analysisStartedAt: new Date(),
        analysisError: null,
      },
    });

    logger.info('Starting analysis', { mediaId, mediaType: media.mediaType });

    // Parallel: Get buffer for EXIF + presigned URL for Claude
    const [mediaBuffer, mediaUrl] = await Promise.all([
      s3Service.getObject(media.storagePath),
      s3Service.generateDownloadUrl(media.storagePath),
    ]);

    // Extract EXIF (fast, local operation)
    const exif = mediaBuffer ? await exifService.extract(mediaBuffer) : null;
    const takenAt = exif?.takenAt ?? media.takenAt;
    const lat = exif?.latitude ?? (media.locationLat ? Number(media.locationLat) : undefined);
    const lng = exif?.longitude ?? (media.locationLng ? Number(media.locationLng) : undefined);

    // Prepare metadata for Claude
    const analysisMetadata = {
      takenAt: takenAt ?? undefined,
      latitude: lat,
      longitude: lng,
      originalFilename: media.originalFilename ?? undefined,
    };

    // Parallel: Setlist.fm lookup + Claude analysis (photo or video frames)
    const [geoMatch, visualAnalysis] = await Promise.all([
      lat && lng && takenAt
        ? setlistService.findByLocation(lat, lng, new Date(takenAt))
        : Promise.resolve(null),
      media.mediaType === 'video' && mediaBuffer
        ? ffmpegService.extractFrames(mediaBuffer, media.duration ?? undefined)
            .then((frames) => frames.length > 0
              ? claudeService.analyzeFrames(frames, analysisMetadata)
              : claudeService.analyzePhoto(mediaUrl, analysisMetadata))
        : claudeService.analyzePhoto(mediaUrl, analysisMetadata),
    ]);

    if (geoMatch) {
      logger.info('Setlist.fm match', { venue: geoMatch.venueName, artists: geoMatch.artists.length });
    }

    // Combine signals
    const analysis = {
      ...visualAnalysis,
      setlistMatch: geoMatch,
      exifExtracted: !!exif,
    };

    // Update with results + extracted EXIF
    await prisma.media.update({
      where: { id: mediaId },
      data: {
        analysisStatus: 'completed',
        analysisCompletedAt: new Date(),
        aiAnalysis: analysis as object,
        ...(exif && {
          locationLat: exif.latitude,
          locationLng: exif.longitude,
          ...(!media.takenAt && exif.takenAt && { takenAt: exif.takenAt }),
        }),
      },
    });

    logger.info('Analysis completed', { mediaId, hasExif: !!exif, hasSetlistMatch: !!geoMatch });
  } catch (error) {
    logger.error('Analysis failed', error as Error, { mediaId });

    await prisma.media.update({
      where: { id: mediaId },
      data: {
        analysisStatus: 'failed',
        analysisCompletedAt: new Date(),
        analysisError: getErrorMessage(error),
      },
    }).catch(() => {});
  }
}

/**
 * Calculate retry interval based on media type and elapsed time
 * Videos take longer to process, so suggest longer intervals
 */
function getRetryAfter(mediaType: 'photo' | 'video', startedAt: Date | null): number | null {
  if (!startedAt) return mediaType === 'video' ? 1000 : 500;

  const elapsed = Date.now() - startedAt.getTime();

  // Progressive backoff
  if (elapsed < 10_000) return mediaType === 'video' ? 1000 : 500;
  if (elapsed < 30_000) return 2000;
  return 5000;
}

function getErrorMessage(error: unknown): string {
  // Axios errors have response.status
  if (error && typeof error === 'object' && 'response' in error) {
    const status = (error as { response?: { status?: number } }).response?.status;
    switch (status) {
      case 400: return 'Invalid media format';
      case 401:
      case 403: return 'Service configuration error';
      case 404: return 'Media file not found';
      case 413: return 'File too large';
      case 429: return 'Rate limited - try again shortly';
      case 500:
      case 502:
      case 503: return 'Service temporarily unavailable';
      case 504: return 'Analysis timed out';
    }
  }

  // Timeout errors (axios, node)
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: string }).code;
    switch (code) {
      case 'ECONNABORTED':
      case 'ETIMEDOUT': return 'Analysis timed out';
      case 'ECONNREFUSED':
      case 'ENOTFOUND': return 'Service unavailable';
    }
  }

  return 'Analysis failed';
}

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
    runAnalysisInBackground(media.id).catch((err) => {
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
