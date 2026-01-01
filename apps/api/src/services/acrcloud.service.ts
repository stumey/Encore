/**
 * ACRCloud Audio Fingerprinting Service
 *
 * NOTE: This is a PREMIUM FEATURE - not used in free tier.
 * ACRCloud requires paid subscription after 14-day trial.
 *
 * Pricing: ~$50/month for 1000 requests
 * Use case: Identify songs playing in concert videos
 */

import crypto from 'crypto';
import axios from 'axios';
import FormData from 'form-data';
import { configService } from '../config/env';
import { Logger } from '../utils/logger';

const logger = new Logger('ACRCloudService');

export interface ACRCloudMatch {
  title: string;
  artist: string;
  album: string | null;
  releaseDate: string | null;
  score: number;
}

function generateSignature(
  accessKey: string,
  secretKey: string,
  timestamp: number
): string {
  const stringToSign = `POST\n/v1/identify\n${accessKey}\naudio\n1\n${timestamp}`;
  return crypto.createHmac('sha1', secretKey).update(stringToSign).digest('base64');
}

export const acrcloudService = {
  /**
   * Identify a song from audio data using ACRCloud's fingerprinting API
   */
  async identify(audioBuffer: Buffer): Promise<ACRCloudMatch | null> {
    const host = configService.get('ACRCLOUD_HOST');
    const accessKey = configService.get('ACRCLOUD_ACCESS_KEY');
    const secretKey = configService.get('ACRCLOUD_SECRET_KEY');

    if (!host || !accessKey || !secretKey) {
      logger.warn('ACRCloud not configured');
      return null;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = generateSignature(accessKey, secretKey, timestamp);

    const form = new FormData();
    form.append('sample', audioBuffer, { filename: 'audio.wav' });
    form.append('access_key', accessKey);
    form.append('data_type', 'audio');
    form.append('signature_version', '1');
    form.append('signature', signature);
    form.append('sample_bytes', audioBuffer.length.toString());
    form.append('timestamp', timestamp.toString());

    try {
      const { data } = await axios.post(`https://${host}/v1/identify`, form, {
        headers: form.getHeaders(),
        timeout: 30000,
      });

      if (data.status?.code !== 0) {
        logger.debug('ACRCloud no match', { code: data.status?.code });
        return null;
      }

      const music = data.metadata?.music?.[0];
      if (!music) return null;

      const match: ACRCloudMatch = {
        title: music.title,
        artist: music.artists?.map((a: { name: string }) => a.name).join(', ') || 'Unknown',
        album: music.album?.name || null,
        releaseDate: music.release_date || null,
        score: music.score || 100,
      };

      logger.info('ACRCloud match', { title: match.title, artist: match.artist });
      return match;
    } catch (error) {
      logger.error('ACRCloud request failed', error as Error);
      return null;
    }
  },
};
