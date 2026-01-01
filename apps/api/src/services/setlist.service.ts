import axios from 'axios';
import { configService } from '../config/env';
import { Logger } from '../utils/logger';
import type { LineupArtist, VenueLineupResponse, EventDay } from '@encore/shared';

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
export type { LineupArtist, VenueLineupResponse, EventDay } from '@encore/shared';

/** Parse dd-MM-yyyy to Date */
function parseSetlistDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Format Date to dd-MM-yyyy */
function toSetlistFormat(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${date.getFullYear()}`;
}

/** Format Date for display: "Fri, Jun 27" */
function toDisplayFormat(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Add days to a date */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export interface GeoMatch {
  venueId: string;
  venueName: string;
  city: string;
  artists: { mbid: string; name: string }[];
}

/** Haversine distance in km */
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const setlistService = {
  /**
   * Find the concert venue closest to GPS coordinates on a given date
   * Returns null if no venue within 2km had a concert that day
   */
  async findByLocation(lat: number, lng: number, date: Date): Promise<GeoMatch | null> {
    const dateStr = toSetlistFormat(date);

    try {
      const { data } = await client.get<SetlistSearchResponse>('/search/setlists', {
        params: { date: dateStr, p: 1 },
      });

      if (!data.setlist?.length) return null;

      let bestMatch: { venue: SetlistFmVenue; distance: number; artists: Map<string, string> } | null = null;

      for (const setlist of data.setlist) {
        const venue = setlist.venue as unknown as SetlistFmVenue;
        if (!venue?.city?.coords) continue;

        const distance = haversine(lat, lng, venue.city.coords.lat, venue.city.coords.long);

        if (distance > 2) continue; // Must be within 2km

        if (!bestMatch || distance < bestMatch.distance) {
          bestMatch = { venue, distance, artists: new Map() };
        }

        if (bestMatch.venue.id === venue.id && setlist.artist?.mbid) {
          bestMatch.artists.set(setlist.artist.mbid, setlist.artist.name);
        }
      }

      if (!bestMatch) return null;

      return {
        venueId: bestMatch.venue.id,
        venueName: bestMatch.venue.name,
        city: bestMatch.venue.city?.name || '',
        artists: Array.from(bestMatch.artists.entries()).map(([mbid, name]) => ({ mbid, name })),
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) return null;
      logger.error('Geo lookup failed', { lat, lng, date: dateStr });
      return null;
    }
  },

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
   * Query a single day's setlists (internal helper).
   * Returns empty array on any error for graceful degradation.
   */
  async _queryDay(
    venueId: string,
    date: string
  ): Promise<{ date: string; setlists: Setlist[] }> {
    try {
      const { data } = await client.get<SetlistSearchResponse>('/search/setlists', {
        params: { venueId, date },
      });
      return { date, setlists: data.setlist || [] };
    } catch (error) {
      // Graceful degradation - return empty on any error
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          // 404 = no events on this day, not an error
          return { date, setlists: [] };
        }
        if (error.response?.status === 429) {
          logger.warn('Setlist.fm rate limited', { venueId, date });
          return { date, setlists: [] };
        }
      }
      logger.error('Setlist.fm day query failed', { venueId, date, error });
      return { date, setlists: [] };
    }
  },

  /**
   * Get all artists who performed at a venue, checking adjacent days for multi-day events.
   * Queries ±3 days around the selected date to detect festivals.
   *
   * @param venueId - Setlist.fm venue ID
   * @param date - Date in dd-MM-yyyy format (Setlist.fm format)
   */
  async getVenueLineup(venueId: string, date: string): Promise<VenueLineupResponse> {
    const emptyResponse: VenueLineupResponse = {
      artists: [],
      venueId,
      queriedDate: date,
      eventDays: [],
      isMultiDay: false,
    };

    try {
      const centerDate = parseSetlistDate(date);

      // Query 7 days in parallel: center ±3 days
      const datesToQuery = [-3, -2, -1, 0, 1, 2, 3].map((offset) =>
        toSetlistFormat(addDays(centerDate, offset))
      );

      const results = await Promise.all(
        datesToQuery.map((d) => this._queryDay(venueId, d))
      );

      // Build artist map: mbid -> { artist info, dates they performed }
      const artistMap = new Map<string, { name: string; dates: Set<string> }>();
      const eventDays: EventDay[] = [];

      for (const { date: dayDate, setlists } of results) {
        if (setlists.length === 0) continue;

        const dayDateObj = parseSetlistDate(dayDate);
        eventDays.push({
          date: dayDate,
          displayDate: toDisplayFormat(dayDateObj),
          artistCount: setlists.length,
        });

        for (const setlist of setlists) {
          const { artist } = setlist;
          if (!artist?.mbid) continue;

          const existing = artistMap.get(artist.mbid);
          if (existing) {
            existing.dates.add(dayDate);
          } else {
            artistMap.set(artist.mbid, {
              name: artist.name,
              dates: new Set([dayDate]),
            });
          }
        }
      }

      if (eventDays.length === 0) {
        return emptyResponse;
      }

      // Sort event days chronologically
      eventDays.sort((a, b) => {
        const dateA = parseSetlistDate(a.date);
        const dateB = parseSetlistDate(b.date);
        return dateA.getTime() - dateB.getTime();
      });

      // Convert to LineupArtist array
      const totalArtists = artistMap.size;
      let headlinerCount = 0;
      const maxHeadliners = Math.min(3, Math.ceil(totalArtists * 0.2));

      const artists: LineupArtist[] = Array.from(artistMap.entries()).map(
        ([mbid, { name, dates }]) => ({
          mbid,
          name,
          isHeadliner: headlinerCount++ < maxHeadliners,
          performanceDates: Array.from(dates),
        })
      );

      // Sort: headliners first, then alphabetically
      artists.sort((a, b) => {
        if (a.isHeadliner && !b.isHeadliner) return -1;
        if (!a.isHeadliner && b.isHeadliner) return 1;
        return a.name.localeCompare(b.name);
      });

      return {
        artists,
        venueId,
        queriedDate: date,
        eventDays,
        isMultiDay: eventDays.length > 1,
      };
    } catch (error) {
      // Graceful degradation - return empty on any error
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          return emptyResponse;
        }
        if (error.response?.status === 429) {
          logger.warn('Setlist.fm rate limited', { venueId, date });
          return emptyResponse;
        }
      }
      logger.error('Setlist.fm venue lineup fetch failed', { venueId, date, error });
      return emptyResponse;
    }
  },
};
