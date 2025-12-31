import axios from 'axios';
import { configService } from '../config/env';
import { Logger } from '../utils/logger';

const logger = new Logger('SetlistService');

const client = axios.create({
  baseURL: 'https://api.setlist.fm/rest/1.0',
  headers: {
    'x-api-key': configService.get('SETLIST_FM_API_KEY'),
    Accept: 'application/json',
  },
  timeout: 10000,
});

export interface SetlistArtist {
  mbid: string;
  name: string;
  sortName?: string;
}

export interface SetlistVenue {
  name: string;
  city: { name: string; country: { name: string } };
}

export interface SetlistFmVenue {
  id: string;
  name: string;
  url: string;
  city?: {
    id: string;
    name: string;
    state?: string;
    stateCode?: string;
    coords?: { lat: number; long: number };
    country: { code: string; name: string };
  };
}

export interface VenueSearchResponse {
  venue: SetlistFmVenue[];
  total: number;
  page: number;
  itemsPerPage: number;
}

export interface Setlist {
  id: string;
  eventDate: string;
  artist: SetlistArtist;
  venue: SetlistVenue;
  sets?: { set: Array<{ song: Array<{ name: string }> }> };
}

export interface SetlistSearchResponse {
  itemsPerPage: number;
  page: number;
  total: number;
  setlist: Setlist[];
}

export const setlistService = {
  async searchArtist(query: string): Promise<SetlistArtist[]> {
    try {
      const { data } = await client.get('/search/artists', {
        params: { artistName: query, p: 1 },
      });
      return data.artist || [];
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return [];
      }
      logger.error('Setlist.fm search failed', { query, error });
      throw error;
    }
  },

  async getArtistSetlists(mbid: string, page = 1): Promise<SetlistSearchResponse> {
    const { data } = await client.get(`/artist/${mbid}/setlists`, {
      params: { p: page },
    });
    return data;
  },

  async getSetlist(setlistId: string): Promise<Setlist> {
    const { data } = await client.get(`/setlist/${setlistId}`);
    return data;
  },

  async searchSetlists(
    artistMbid: string,
    date?: string,
    venue?: string
  ): Promise<SetlistSearchResponse> {
    const params: Record<string, string> = { artistMbid };
    if (date) params.date = date; // Format: dd-MM-yyyy
    if (venue) params.venueName = venue;
    const { data } = await client.get('/search/setlists', { params });
    return data;
  },

  async searchVenues(query: string, page = 1): Promise<{ venues: SetlistFmVenue[]; total: number }> {
    try {
      const { data } = await client.get<VenueSearchResponse>('/search/venues', {
        params: { name: query, p: page },
      });
      return {
        venues: data.venue || [],
        total: data.total || 0,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return { venues: [], total: 0 };
      }
      logger.error('Setlist.fm venue search failed', { query, error });
      throw error;
    }
  },
};
