import { MediaType, TicketSource, AnalysisStatus } from './enums';

export interface User {
  id: string;
  cognitoId: string;
  email: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Artist {
  id: string;
  name: string;
  geniusId: string | null;
  mbid: string | null;
  imageUrl: string | null;
  genres: string[];
  createdAt: Date | string;
}

export interface Venue {
  id: string;
  name: string;
  setlistFmId: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  createdAt: Date | string;
}

export interface Concert {
  id: string;
  userId: string;
  venueId: string | null;
  concertDate: Date | string;
  tourName: string | null;
  confidenceScore: number | null;
  notes: string | null;
  isVerified: boolean;
  createdAt: Date | string;
}

export interface ConcertArtist {
  concertId: string;
  artistId: string;
  isHeadliner: boolean;
  setOrder: number | null;
}

export interface Media {
  id: string;
  concertId: string | null;
  userId: string;
  mediaType: MediaType;
  storagePath: string;
  thumbnailPath: string | null;
  originalFilename: string | null;
  duration: number | null;
  takenAt: Date | string | null;
  locationLat: number | null;
  locationLng: number | null;
  aiAnalysis: AiAnalysis | null;
  analysisStatus: AnalysisStatus;
  analysisStartedAt: Date | string | null;
  analysisCompletedAt: Date | string | null;
  analysisError: string | null;
  createdAt: Date | string;
}

export interface Setlist {
  id: string;
  concertId: string;
  setlistFmId: string | null;
  songs: SetlistSong[];
  createdAt: Date | string;
}

export interface SetlistSong {
  position: number;
  name: string;
  encore: boolean;
}

export interface Ticket {
  id: string;
  concertId: string | null;
  userId: string;
  source: TicketSource;
  sourceId: string | null;
  pdfStoragePath: string | null;
  purchasePrice: number | null;
  section: string | null;
  row: string | null;
  seat: string | null;
  rawData: Record<string, unknown> | null;
  createdAt: Date | string;
}

export interface Follow {
  followerId: string;
  followingId: string;
  createdAt: Date | string;
}

// AI Analysis types
export interface AiAnalysis {
  artist: ArtistAnalysis;
  venue: VenueAnalysis;
  tour: TourAnalysis;
  estimatedDate: string | null;
  overallConfidence: number;
  reasoning: string;
}

export interface ArtistAnalysis {
  name: string | null;
  confidence: number;
  clues: string[];
}

export interface VenueAnalysis {
  name: string | null;
  city: string | null;
  type: string;
  confidence: number;
  clues: string[];
}

export interface TourAnalysis {
  name: string | null;
  confidence: number;
  clues: string[];
}
