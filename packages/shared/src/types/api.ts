import type { User, Artist, Venue, Concert, Media, Setlist, ConcertArtist } from './entities';

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

// Expanded entity types with relations
export interface UserProfile extends Pick<User, 'id' | 'username' | 'displayName' | 'email' | 'avatarUrl' | 'isPublic' | 'createdAt'> {}

export interface UserStats {
  totalConcerts: number;
  uniqueArtists: number;
  uniqueVenues: number;
  totalMedia: number;
  mostSeenArtist: {
    artist: Pick<Artist, 'id' | 'name' | 'imageUrl'>;
    count: number;
  } | null;
}

export interface ArtistWithCount {
  artist: Artist;
  concertCount: number;
  firstSeen: Date | string | null;
  lastSeen: Date | string | null;
}

export interface ConcertWithDetails extends Concert {
  venue: Venue | null;
  artists: (ConcertArtist & { artist: Artist })[];
  media?: Media[];
  setlist?: Setlist | null;
  _count?: { media: number };
}

export interface ArtistWithConcerts extends Artist {
  concerts: (ConcertArtist & {
    concert: Concert & { venue: Venue | null };
  })[];
}

export interface VenueWithConcerts extends Venue {
  concerts: ConcertWithDetails[];
}

export interface MatchSuggestion {
  concertId: string;
  confidence: number;
  matchedVia: string;
  concert: {
    date: Date | string;
    venue: string | null;
    artists: string[];
  } | null;
}

export interface MediaWithUrls extends Media {
  downloadUrl: string;
  thumbnailUrl: string | null;
  retryAfter?: number | null;
  concert?: (Pick<Concert, 'id' | 'concertDate'> & {
    venue?: Pick<Venue, 'name' | 'city'> | null;
    artists: (ConcertArtist & { artist: Pick<Artist, 'id' | 'name'> })[];
  }) | null;
  matchSuggestions?: MatchSuggestion[];
}

// Setlist.fm lineup suggestion types
export interface LineupArtist {
  mbid: string;
  name: string;
  isHeadliner: boolean;
  performanceDates: string[]; // dates this artist performed (dd-MM-yyyy format)
}

export interface EventDay {
  date: string; // dd-MM-yyyy format
  displayDate: string; // Human readable: "Fri, Jun 27"
  artistCount: number;
}

export interface VenueLineupResponse {
  artists: LineupArtist[];
  eventName?: string;
  venueId: string;
  queriedDate: string; // original date user selected
  eventDays: EventDay[]; // all days with events at this venue
  isMultiDay: boolean;
}
