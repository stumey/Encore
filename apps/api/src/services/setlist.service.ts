import axios from 'axios';
import { configService } from '../config/env';
import { Logger } from '../utils/logger';
import type { LineupArtist, VenueLineupResponse } from '@encore/shared';

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

// Re-export shared types for convenience
export type { LineupArtist, VenueLineupResponse } from '@encore/shared';

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

  /**
   * Get all artists who performed at a venue on a specific date.
   * Useful for festivals and multi-artist events.
   *
   * @param venueId - Setlist.fm venue ID
   * @param date - Date in dd-MM-yyyy format (Setlist.fm format)
   */
  async getVenueLineup(venueId: string, date: string): Promise<VenueLineupResponse> {
    try {
      const { data } = await client.get<SetlistSearchResponse>('/search/setlists', {
        params: { venueId, date },
      });

      const setlists = data.setlist || [];
      const totalArtists = setlists.length;

      // Each setlist represents one artist's performance
      // Extract unique artists by MBID
      const artistMap = new Map<string, LineupArtist>();

      for (let i = 0; i < setlists.length; i++) {
        const { artist } = setlists[i];
        if (artist?.mbid && !artistMap.has(artist.mbid)) {
          artistMap.set(artist.mbid, {
            mbid: artist.mbid,
            name: artist.name,
            // First few in the list are typically headliners (higher billing)
            isHeadliner: i < Math.min(3, Math.ceil(totalArtists * 0.2)),
          });
        }
      }

      // Convert to array with headliners first
      const artists = Array.from(artistMap.values()).sort((a, b) => {
        if (a.isHeadliner && !b.isHeadliner) return -1;
        if (!a.isHeadliner && b.isHeadliner) return 1;
        return 0;
      });

      return { artists, venueId, date };
    } catch (error) {
      // Graceful degradation - return empty on any error
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          return { artists: [], venueId, date };
        }
        if (error.response?.status === 429) {
          logger.warn('Setlist.fm rate limited', { venueId, date });
          return { artists: [], venueId, date };
        }
      }
      logger.error('Setlist.fm venue lineup fetch failed', { venueId, date, error });
      return { artists: [], venueId, date };
    }
  },
};
