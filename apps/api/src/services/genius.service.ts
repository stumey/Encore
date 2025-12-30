import axios from 'axios';
import { configService } from '../config/env';
import { Logger } from '../utils/logger';

const logger = new Logger('GeniusService');

let accessToken: string | null = null;
let tokenExpiresAt = 0;

const clientId = configService.get('GENIUS_CLIENT_ID');
const clientSecret = configService.get('GENIUS_CLIENT_SECRET');

async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (accessToken && Date.now() < tokenExpiresAt - 60000) {
    return accessToken;
  }

  // Genius OAuth2 client credentials flow
  const { data } = await axios.post(
    'https://api.genius.com/oauth/token',
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  accessToken = data.access_token;
  // Genius tokens typically don't expire, but we'll refresh every 24 hours to be safe
  tokenExpiresAt = Date.now() + (data.expires_in ? data.expires_in * 1000 : 24 * 60 * 60 * 1000);
  logger.debug('Genius token refreshed');
  return accessToken!;
}

const api = axios.create({
  baseURL: 'https://api.genius.com',
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  config.headers.Authorization = `Bearer ${await getAccessToken()}`;
  return config;
});

export interface GeniusArtist {
  id: number;
  name: string;
  image_url: string | null;
  url: string;
  is_verified: boolean;
  header_image_url?: string;
}

export interface GeniusSearchHit {
  type: string;
  result: {
    id: number;
    title: string;
    url: string;
    primary_artist: GeniusArtist;
    artist_names: string;
  };
}

export interface GeniusSearchResponse {
  response: {
    hits: GeniusSearchHit[];
  };
}

export interface GeniusArtistResponse {
  response: {
    artist: GeniusArtist & {
      description?: { plain: string };
      facebook_name?: string;
      instagram_name?: string;
      twitter_name?: string;
    };
  };
}

export const geniusService = {
  /**
   * Search for artists by name
   * Note: Genius search returns songs, so we extract unique artists from results
   */
  async searchArtist(query: string, limit = 10): Promise<GeniusArtist[]> {
    try {
      const { data } = await api.get<GeniusSearchResponse>('/search', {
        params: { q: query },
      });

      // Extract unique artists from song results
      const artistMap = new Map<number, GeniusArtist>();
      for (const hit of data.response.hits) {
        if (hit.type === 'song' && hit.result.primary_artist) {
          const artist = hit.result.primary_artist;
          if (!artistMap.has(artist.id)) {
            artistMap.set(artist.id, artist);
          }
        }
        if (artistMap.size >= limit) break;
      }

      return Array.from(artistMap.values());
    } catch (error) {
      logger.error('Error searching artists', error as Error);
      return [];
    }
  },

  /**
   * Get full artist details by Genius ID
   */
  async getArtist(id: number | string): Promise<GeniusArtist | null> {
    try {
      const { data } = await api.get<GeniusArtistResponse>(`/artists/${id}`);
      return data.response.artist;
    } catch (error) {
      logger.error('Error fetching artist', error as Error);
      return null;
    }
  },
};
