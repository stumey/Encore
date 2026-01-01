/**
 * AudD Audio Recognition Service
 *
 * NOTE: This is a PREMIUM FEATURE - not used in free tier.
 *
 * Pricing: $5 per 1000 requests ($0.005/request)
 * - 100k requests/month: $450
 * - 200k requests/month: $800
 *
 * Use case: Identify songs from concert videos, returns Spotify/Apple Music links
 */

import axios from 'axios';
import FormData from 'form-data';
import { configService } from '../config/env';
import { Logger } from '../utils/logger';

const logger = new Logger('AudDService');

export interface AudDMatch {
  title: string;
  artist: string;
  album: string | null;
  releaseDate: string | null;
  links: {
    spotify: string | null;
    appleMusic: string | null;
    youtube: string | null;
    soundcloud: string | null;
  };
}

const api = axios.create({
  baseURL: 'https://api.audd.io',
  timeout: 30000,
});

export const auddService = {
  /**
   * Identify a song from audio data using AudD's recognition API
   */
  async identify(audioBuffer: Buffer): Promise<AudDMatch | null> {
    const apiKey = configService.get('AUDD_API_KEY');

    if (!apiKey) {
      logger.warn('AudD not configured');
      return null;
    }

    const form = new FormData();
    form.append('file', audioBuffer, { filename: 'audio.wav' });
    form.append('api_token', apiKey);
    form.append('return', 'spotify,apple_music,youtube,soundcloud');

    try {
      const { data } = await api.post('/', form, {
        headers: form.getHeaders(),
      });

      if (data.status !== 'success' || !data.result) {
        logger.debug('AudD no match', { status: data.status });
        return null;
      }

      const result = data.result;
      const match: AudDMatch = {
        title: result.title,
        artist: result.artist,
        album: result.album || null,
        releaseDate: result.release_date || null,
        links: {
          spotify: result.spotify?.external_urls?.spotify || null,
          appleMusic: result.apple_music?.url || null,
          youtube: result.youtube?.link || null,
          soundcloud: result.soundcloud?.url || null,
        },
      };

      logger.info('AudD match', { title: match.title, artist: match.artist });
      return match;
    } catch (error) {
      logger.error('AudD request failed', error as Error);
      return null;
    }
  },
};
