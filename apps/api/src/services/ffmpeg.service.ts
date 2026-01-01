import { spawn, ChildProcess } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import { Logger } from '../utils/logger';

const logger = new Logger('FfmpegService');

const AUDIO_SAMPLE_DURATION = 15;
const AUDIO_SAMPLE_RATE = 44100;
const MAX_FRAMES = 5;

export const ffmpegService = {
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
      proc.stdin?.write(videoBuffer);
      proc.stdin?.end();
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

      proc.stdin?.write(videoBuffer);
      proc.stdin?.end();
    });
  },
};
