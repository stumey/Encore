import axios from 'axios';
import { configService } from '../config/env';
import { Logger } from '../utils/logger';

const logger = new Logger('SpotifyService');

let accessToken: string | null = null;
let tokenExpiresAt = 0;

const clientId = configService.get('SPOTIFY_CLIENT_ID');
const clientSecret = configService.get('SPOTIFY_CLIENT_SECRET');

async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiresAt - 60000) {
    return accessToken;
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const { data } = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({ grant_type: 'client_credentials' }),
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  accessToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
  logger.debug('Spotify token refreshed');
  return accessToken!;
}

const api = axios.create({
  baseURL: 'https://api.spotify.com/v1',
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  config.headers.Authorization = `Bearer ${await getAccessToken()}`;
  return config;
});

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: SpotifyImage[];
  genres: string[];
  popularity: number;
  followers?: { total: number };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  preview_url: string | null;
  album: { name: string; images: SpotifyImage[] };
}

export const spotifyService = {
  async searchArtist(query: string, limit = 10): Promise<SpotifyArtist[]> {
    const { data } = await api.get('/search', {
      params: { q: query, type: 'artist', limit },
    });
    return data.artists?.items || [];
  },

  async getArtist(id: string): Promise<SpotifyArtist> {
    const { data } = await api.get(`/artists/${id}`);
    return data;
  },

  async getArtistTopTracks(id: string, market = 'US'): Promise<SpotifyTrack[]> {
    const { data } = await api.get(`/artists/${id}/top-tracks`, {
      params: { market },
    });
    return data.tracks || [];
  },
};
