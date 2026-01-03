import { spawn, ChildProcess } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import { Logger } from '../utils/logger';

const logger = new Logger('FfmpegService');

const AUDIO_SAMPLE_DURATION = 15;
const AUDIO_SAMPLE_RATE = 44100;
const MAX_FRAMES = 5;

// Tag names that may contain creation/recording date, in order of preference
const DATE_TAG_NAMES = [
  'com.apple.quicktime.creationdate', // iOS
  'creation_time',                     // Generic MOV/MP4
  'date',                              // Some formats
  'date_recorded',                     // Some formats
  'encoded_date',                      // MKV
];

// Tag names that may contain GPS location
const LOCATION_TAG_NAMES = [
  'com.apple.quicktime.location.ISO6709', // iOS primary
  'location',                              // Android/generic
  'location-eng',                          // Some formats
];

export interface VideoMetadata {
  creationTime: Date | null;
  duration: number | null;
  latitude: number | null;
  longitude: number | null;
}

/**
 * Parse ISO 6709 location string (e.g., "+35.6895+139.6917/" or "+35.6895+139.6917+35.000/")
 * Format: ±lat±lng[±altitude]/
 */
function parseISO6709(locationStr: string): { latitude: number; longitude: number } | null {
  if (!locationStr || locationStr.length < 3) return null;

  const str = locationStr.trim().replace(/\/$/, ''); // Remove trailing slash

  // Find sign positions - the string starts with a sign for latitude,
  // then has another sign to start longitude (and optionally altitude)
  const signPositions: number[] = [];
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '+' || str[i] === '-') {
      signPositions.push(i);
    }
  }

  // Need at least 2 signs (lat and lng)
  if (signPositions.length < 2) return null;

  // First segment is latitude (from position 0 to second sign)
  const latStr = str.substring(signPositions[0], signPositions[1]);
  // Second segment is longitude (from second sign to third sign or end)
  const lngEnd = signPositions.length > 2 ? signPositions[2] : str.length;
  const lngStr = str.substring(signPositions[1], lngEnd);

  const latitude = parseFloat(latStr);
  const longitude = parseFloat(lngStr);

  if (isNaN(latitude) || isNaN(longitude)) return null;

  // Validate ranges
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }

  return { latitude, longitude };
}

export const ffmpegService = {
  /**
   * Extract metadata from video buffer using ffprobe JSON output
   */
  async extractMetadata(videoBuffer: Buffer): Promise<VideoMetadata | null> {
    if (!ffprobePath?.path) {
      logger.warn('ffprobe binary not found');
      return null;
    }

    return new Promise((resolve) => {
      const stdoutChunks: Buffer[] = [];

      const proc: ChildProcess = spawn(ffprobePath.path, [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-i', 'pipe:0',
      ]);

      proc.stdout?.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));
      proc.stderr?.on('data', () => {});

      proc.on('close', (code) => {
        if (code !== 0 || stdoutChunks.length === 0) {
          logger.debug('ffprobe returned no data', { code });
          resolve(null);
          return;
        }

        try {
          const json = JSON.parse(Buffer.concat(stdoutChunks).toString());
          const tags = json.format?.tags || {};

          // Duration from format
          const duration = json.format?.duration
            ? Math.floor(parseFloat(json.format.duration))
            : null;

          // Try each date tag in order of preference
          let creationTime: Date | null = null;
          for (const tagName of DATE_TAG_NAMES) {
            const value = tags[tagName];
            if (value) {
              const parsed = new Date(value);
              if (!isNaN(parsed.getTime())) {
                creationTime = parsed;
                logger.debug('Found creation time', { tagName, value });
                break;
              }
            }
          }

          // Try each location tag in order of preference
          let latitude: number | null = null;
          let longitude: number | null = null;
          for (const tagName of LOCATION_TAG_NAMES) {
            const value = tags[tagName];
            if (value) {
              const parsed = parseISO6709(value);
              if (parsed) {
                latitude = parsed.latitude;
                longitude = parsed.longitude;
                logger.debug('Found GPS location', { tagName, value, latitude, longitude });
                break;
              }
            }
          }

          logger.debug('Video metadata parsed', { creationTime, duration, latitude, longitude, availableTags: Object.keys(tags) });

          resolve(creationTime || duration || latitude ? { creationTime, duration, latitude, longitude } : null);
        } catch (err) {
          logger.warn('Failed to parse ffprobe JSON', { error: (err as Error).message });
          resolve(null);
        }
      });

      proc.on('error', (err) => {
        logger.warn('ffprobe error', { error: err.message });
        resolve(null);
      });

      proc.stdin?.on('error', () => {});
      proc.stdin?.write(videoBuffer, (err) => {
        if (!err) proc.stdin?.end();
      });
    });
  },

  /**
   * Extract multiple frames from video at even intervals
   * Returns array of JPEG buffers for visual analysis
   */
  async extractFrames(videoBuffer: Buffer, durationSeconds?: number): Promise<Buffer[]> {
    if (!ffmpegPath) return [];

    // Determine frame timestamps based on duration
    const duration = durationSeconds || 60; // Default assume 1 min
    const frameCount = Math.min(MAX_FRAMES, Math.ceil(duration / 20)); // ~1 frame per 20s
    const interval = duration / (frameCount + 1);
    const timestamps = Array.from({ length: frameCount }, (_, i) => Math.floor(interval * (i + 1)));

    const frames: Buffer[] = [];

    for (const ts of timestamps) {
      const frame = await this.extractFrameAt(videoBuffer, ts);
      if (frame) frames.push(frame);
    }

    logger.debug('Extracted frames', { count: frames.length, timestamps });
    return frames;
  },

  /**
   * Extract single frame at specific timestamp
   */
  async extractFrameAt(videoBuffer: Buffer, seconds: number): Promise<Buffer | null> {
    if (!ffmpegPath) return null;
    const binaryPath: string = ffmpegPath;

    return new Promise((resolve) => {
      const chunks: Buffer[] = [];

      const proc: ChildProcess = spawn(binaryPath, [
        '-ss', String(seconds),
        '-i', 'pipe:0',
        '-vframes', '1',
        '-f', 'image2',
        '-vcodec', 'mjpeg',
        '-q:v', '3',
        'pipe:1',
      ]);

      proc.stdout?.on('data', (chunk: Buffer) => chunks.push(chunk));
      proc.stderr?.on('data', () => {});

      proc.on('close', (code: number | null) => {
        if (code !== 0 || chunks.length === 0) {
          resolve(null);
          return;
        }
        resolve(Buffer.concat(chunks));
      });

      proc.on('error', () => resolve(null));

      // Handle stdin errors (EPIPE) to prevent uncaught exceptions
      proc.stdin?.on('error', (err) => {
        logger.debug('ffmpeg stdin error (expected if ffmpeg exits early)', { error: err.message });
      });

      proc.stdin?.write(videoBuffer, (err) => {
        if (err) {
          logger.debug('ffmpeg stdin write error', { error: err.message });
        }
        proc.stdin?.end();
      });
    });
  },

  /**
   * Extract audio clip from video buffer for fingerprinting
   * Returns WAV buffer suitable for ACRCloud/AudD (PREMIUM FEATURE)
   */
  async extractAudio(videoBuffer: Buffer): Promise<Buffer | null> {
    if (!ffmpegPath) {
      logger.error('ffmpeg binary not found');
      return null;
    }

    const binaryPath: string = ffmpegPath;

    return new Promise((resolve) => {
      const chunks: Buffer[] = [];

      // ffmpeg: read from stdin, output WAV to stdout
      const proc: ChildProcess = spawn(binaryPath, [
        '-i', 'pipe:0',
        '-t', String(AUDIO_SAMPLE_DURATION),
        '-ar', String(AUDIO_SAMPLE_RATE),
        '-ac', '1',
        '-f', 'wav',
        'pipe:1',
      ]);

      proc.stdout?.on('data', (chunk: Buffer) => chunks.push(chunk));

      proc.stderr?.on('data', (data: Buffer) => {
        const msg = data.toString();
        if (msg.includes('Error') || msg.includes('Invalid')) {
          logger.debug('ffmpeg stderr', { msg: msg.slice(0, 200) });
        }
      });

      proc.on('close', (code: number | null) => {
        if (code !== 0 || chunks.length === 0) {
          logger.warn('ffmpeg extraction failed', { code });
          resolve(null);
          return;
        }

        const audioBuffer = Buffer.concat(chunks);
        logger.debug('Audio extracted', { bytes: audioBuffer.length });
        resolve(audioBuffer);
      });

      proc.on('error', (error: Error) => {
        logger.error('ffmpeg spawn error', error);
        resolve(null);
      });

      // Handle stdin errors (EPIPE) to prevent uncaught exceptions
      proc.stdin?.on('error', (err) => {
        logger.debug('ffmpeg stdin error (expected if ffmpeg exits early)', { error: err.message });
      });

      proc.stdin?.write(videoBuffer, (err) => {
        if (err) {
          logger.debug('ffmpeg stdin write error', { error: err.message });
        }
        proc.stdin?.end();
      });
    });
  },
};
