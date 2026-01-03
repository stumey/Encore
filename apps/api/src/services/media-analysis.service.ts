import { prisma } from '../database/prisma';
import { s3Service } from './s3.service';
import { claudeService } from './claude.service';
import { exifService } from './exif.service';
import { ffmpegService } from './ffmpeg.service';
import { concertMatchingService } from './concert-matching.service';
import { Logger } from '../utils/logger';

const logger = new Logger('MediaAnalysisService');

/**
 * Calculate retry interval based on media type and elapsed time
 * Videos take longer to process, so suggest longer intervals
 */
export function getRetryAfter(mediaType: 'photo' | 'video', startedAt: Date | null): number | null {
  if (!startedAt) return mediaType === 'video' ? 1000 : 500;

  const elapsed = Date.now() - startedAt.getTime();

  // Progressive backoff
  if (elapsed < 10_000) return mediaType === 'video' ? 1000 : 500;
  if (elapsed < 30_000) return 2000;
  return 5000;
}

/**
 * Map error types to user-friendly messages
 */
export function getErrorMessage(error: unknown): string {
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

export const mediaAnalysisService = {
  /**
   * Run media analysis in background (fire-and-forget)
   * Combines EXIF metadata, Setlist.fm lookup, and Claude visual analysis
   */
  async runAnalysis(mediaId: string): Promise<void> {
    let media;
    let exif: Awaited<ReturnType<typeof exifService.extract>> = null;

    try {
      media = await prisma.media.update({
        where: { id: mediaId },
        data: {
          analysisStatus: 'processing',
          analysisStartedAt: new Date(),
          analysisError: null,
        },
      });

      logger.info('Starting analysis', { mediaId, mediaType: media.mediaType });

      // Get buffer for EXIF extraction
      const mediaBuffer = await s3Service.getObject(media.storagePath);

      let takenAtFromMetadata: Date | null = null;
      let latFromMetadata: number | null = null;
      let lngFromMetadata: number | null = null;

      // Extract metadata first and save immediately
      // This ensures we get the date even if Claude analysis fails
      if (mediaBuffer) {
        let durationFromMetadata: number | null = null;
        let thumbnailPath: string | null = null;

        if (media.mediaType === 'video') {
          // For videos, use FFmpeg to extract creation time, duration, and GPS
          const videoMeta = await ffmpegService.extractMetadata(mediaBuffer);
          if (videoMeta) {
            takenAtFromMetadata = videoMeta.creationTime;
            durationFromMetadata = videoMeta.duration;
            latFromMetadata = videoMeta.latitude;
            lngFromMetadata = videoMeta.longitude;
            logger.info('Video metadata extracted', {
              mediaId,
              creationTime: videoMeta.creationTime,
              duration: videoMeta.duration,
              latitude: videoMeta.latitude,
              longitude: videoMeta.longitude,
            });
          }

          // Generate thumbnail from video (at 1 second to skip potential black frames)
          if (!media.thumbnailPath) {
            try {
              const thumbnailBuffer = await ffmpegService.extractFrameAt(mediaBuffer, 1);
              if (thumbnailBuffer) {
                const lastDot = media.storagePath.lastIndexOf('.');
                const basePath = lastDot > 0 ? media.storagePath.substring(0, lastDot) : media.storagePath;
                thumbnailPath = `${basePath}_thumb.jpg`;
                await s3Service.uploadBuffer(thumbnailBuffer, thumbnailPath, 'image/jpeg');
                logger.info('Video thumbnail generated', { mediaId, thumbnailPath });
              }
            } catch (err) {
              logger.warn('Failed to generate video thumbnail', { mediaId, error: (err as Error).message });
            }
          }
        } else {
          // For photos, use EXIF
          exif = await exifService.extract(mediaBuffer);
          if (exif) {
            takenAtFromMetadata = exif.takenAt;
          }
        }

        // Build update object with extracted metadata
        const hasUpdates =
          (!media.takenAt && takenAtFromMetadata) ||
          (!media.duration && durationFromMetadata) ||
          thumbnailPath ||
          exif?.latitude ||
          exif?.longitude;

        if (hasUpdates) {
          await prisma.media.update({
            where: { id: mediaId },
            data: {
              ...(!media.takenAt && takenAtFromMetadata && { takenAt: takenAtFromMetadata }),
              ...(!media.duration && durationFromMetadata && { duration: durationFromMetadata }),
              ...(thumbnailPath && { thumbnailPath }),
              ...(exif?.latitude && { locationLat: exif.latitude }),
              ...(exif?.longitude && { locationLng: exif.longitude }),
            },
          });
          logger.info('Metadata saved', {
            mediaId,
            hasTakenAt: !!(takenAtFromMetadata && !media.takenAt),
            hasDuration: !!(durationFromMetadata && !media.duration),
            hasThumbnail: !!thumbnailPath,
            hasGps: !!(exif?.latitude && exif?.longitude),
          });
        }
      }

      // Get presigned URL for Claude
      const mediaUrl = await s3Service.generateDownloadUrl(media.storagePath);

      const takenAt = takenAtFromMetadata ?? exif?.takenAt ?? media.takenAt;
      const lat = latFromMetadata ?? exif?.latitude ?? (media.locationLat ? Number(media.locationLat) : undefined);
      const lng = lngFromMetadata ?? exif?.longitude ?? (media.locationLng ? Number(media.locationLng) : undefined);

      // Prepare metadata for Claude
      const analysisMetadata = {
        takenAt: takenAt ?? undefined,
        latitude: lat,
        longitude: lng,
        originalFilename: media.originalFilename ?? undefined,
      };

      // Claude analysis (photo or video frames)
      // GPS matching now happens directly in concertMatchingService using venue coordinates
      let visualAnalysis = null;
      try {
        if (media.mediaType === 'video' && mediaBuffer) {
          const frames = await ffmpegService.extractFrames(mediaBuffer, media.duration ?? undefined);
          visualAnalysis = frames.length > 0
            ? await claudeService.analyzeFrames(frames, analysisMetadata)
            : await claudeService.analyzePhoto(mediaUrl, analysisMetadata);
        } else {
          visualAnalysis = await claudeService.analyzePhoto(mediaUrl, analysisMetadata);
        }
      } catch (err) {
        logger.warn('Claude analysis failed, continuing with metadata-only matching', {
          error: (err as Error).message,
        });
      }

      // Combine signals (visualAnalysis may be null if Claude failed)
      const analysis = {
        ...(visualAnalysis || {}),
        exifExtracted: !!exif,
        claudeAnalysisFailed: !visualAnalysis,
      };

      // Update with AI analysis results
      await prisma.media.update({
        where: { id: mediaId },
        data: {
          analysisStatus: visualAnalysis ? 'completed' : 'completed', // Still completed, just without AI
          analysisCompletedAt: new Date(),
          aiAnalysis: analysis as object,
        },
      });

      logger.info('Analysis completed', {
        mediaId,
        hasExif: !!exif,
        hasTakenAt: !!takenAt,
        hasGps: !!(lat && lng),
        hasClaudeAnalysis: !!visualAnalysis,
      });

      // Attempt to match media to existing concerts
      const finalTakenAt = takenAt ? new Date(takenAt) : null;
      const matchResult = await concertMatchingService.findMatches({
        userId: media.userId,
        takenAt: finalTakenAt,
        locationLat: lat ?? null,
        locationLng: lng ?? null,
        visualAnalysis,
      });

      if (matchResult.autoMatched) {
        await concertMatchingService.applyMatch(mediaId, matchResult.autoMatched);
      } else if (matchResult.suggestions.length > 0) {
        // Store suggestions in aiAnalysis for UI to display
        await prisma.media.update({
          where: { id: mediaId },
          data: {
            aiAnalysis: {
              ...analysis,
              matchSuggestions: matchResult.suggestions,
            } as object,
          },
        });
        logger.info('Match suggestions stored', {
          mediaId,
          count: matchResult.suggestions.length,
        });
      }
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
  },
};
