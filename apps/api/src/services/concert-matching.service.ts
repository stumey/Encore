import { prisma } from '../database/prisma';
import { Logger } from '../utils/logger';
import type { PhotoAnalysis } from './claude.service';

const logger = new Logger('ConcertMatchingService');

/**
 * Confidence thresholds for matching decisions
 *
 * AUTO_MATCH: High enough confidence to assign without user confirmation
 * SUGGESTION: Worth showing to user as a potential match
 */
const AUTO_MATCH_THRESHOLD = 0.80;
const SUGGESTION_THRESHOLD = 0.50;


export interface MatchSignals {
  userId: string;
  takenAt: Date | null;
  locationLat: number | null;
  locationLng: number | null;
  visualAnalysis: PhotoAnalysis | null;
  setlistMatch: {
    venueName: string;
    city: string;
    artists: { name: string }[];
  } | null;
}

export interface MatchMetadata {
  confidence: number;
  signals: {
    gpsMatch: boolean;
    dateMatch: boolean;
    venueMatch: boolean;
    artistMatch: boolean;
    setlistConfirmed: boolean;
  };
  matchedVia: string;
}

export interface ConcertMatch {
  concertId: string;
  metadata: MatchMetadata;
}

export interface MatchResult {
  autoMatched: ConcertMatch | null;
  suggestions: ConcertMatch[];
}

// ─────────────────────────────────────────────────────────────────────────────
// String Matching (Intl.Collator - no regex, no library)
// ─────────────────────────────────────────────────────────────────────────────

const collatorOpts: Intl.CollatorOptions = { sensitivity: 'base', ignorePunctuation: true };

/**
 * Compare two strings, ignoring case, accents, and punctuation
 */
function stringsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;

  // Exact match (ignoring case/accents/punctuation)
  if (a.localeCompare(b, 'en', collatorOpts) === 0) return true;

  // One contains the other
  const normA = a.toLocaleLowerCase('en');
  const normB = b.toLocaleLowerCase('en');
  return normA.includes(normB) || normB.includes(normA);
}

// ─────────────────────────────────────────────────────────────────────────────
// Date Matching
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if media date falls within the concert date range
 * Uses a dynamic buffer based on event length for timezone edge cases
 *
 * Buffer logic:
 * - 1-day event: 1 day buffer
 * - 2-day event: 1 day buffer
 * - 3-4 day event: 2 day buffer
 * - 5+ day event: scales with ceil(eventDays / 2)
 *
 * @param mediaDate - When the media was taken
 * @param startDate - Concert start date
 * @param endDate - Concert end date (null for single-day events)
 */
function datesMatch(mediaDate: Date, startDate: Date, endDate: Date | null): boolean {
  const effectiveEnd = endDate || startDate;
  const msPerDay = 24 * 60 * 60 * 1000;

  // Calculate event duration in days (inclusive)
  const eventDays = Math.round((effectiveEnd.getTime() - startDate.getTime()) / msPerDay) + 1;

  // Dynamic buffer: ceil(eventDays / 2), minimum 1 day
  const bufferDays = Math.max(1, Math.ceil(eventDays / 2));
  const bufferMs = bufferDays * msPerDay;

  const rangeStart = startDate.getTime() - bufferMs;
  const rangeEnd = effectiveEnd.getTime() + bufferMs;
  const mediaTime = mediaDate.getTime();

  return mediaTime >= rangeStart && mediaTime <= rangeEnd;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scoring Logic
// ─────────────────────────────────────────────────────────────────────────────

interface ScoringInput {
  gpsMatch: boolean;
  dateMatch: boolean;
  venueMatch: boolean;
  artistMatch: boolean;
  setlistConfirmed: boolean;
  visualConfidence: number; // 0-1 from Claude
}

/**
 * Calculate match confidence score based on available signals
 *
 * Scoring rationale:
 * - GPS + date is near-certain (0.95) - you were physically there
 * - Setlist.fm match is very strong (0.90) - authoritative source
 * - Venue + artist + date is strong (0.85) - multiple confirmations
 * - Single signals are weaker and stack
 */
function calculateConfidence(input: ScoringInput): { confidence: number; matchedVia: string } {
  const { gpsMatch, dateMatch, venueMatch, artistMatch, setlistConfirmed, visualConfidence } = input;

  // Tier 1: GPS + date = near certain
  if (gpsMatch && dateMatch) {
    return { confidence: 0.95, matchedVia: 'gps+date' };
  }

  // Tier 2: Setlist.fm confirmed + date = very strong
  if (setlistConfirmed && dateMatch) {
    return { confidence: 0.90, matchedVia: 'setlist+date' };
  }

  // Tier 3: Multiple signals stacking
  let score = 0;
  const signals: string[] = [];

  if (dateMatch) {
    score += 0.35;
    signals.push('date');
  }

  if (venueMatch) {
    score += 0.30;
    signals.push('venue');
  }

  if (artistMatch) {
    score += 0.25;
    signals.push('artist');
  }

  // Visual confidence acts as a multiplier on artist/venue matches
  if ((venueMatch || artistMatch) && visualConfidence > 0) {
    score *= (0.7 + visualConfidence * 0.3);
  }

  return {
    confidence: Math.min(score, 0.89), // Cap below Tier 2
    matchedVia: signals.join('+') || 'none',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

export const concertMatchingService = {
  /**
   * Find matching concerts for analyzed media
   */
  async findMatches(signals: MatchSignals): Promise<MatchResult> {
    const { userId, takenAt, locationLat, locationLng, visualAnalysis, setlistMatch } = signals;

    // Need at least a date to attempt matching
    if (!takenAt) {
      logger.debug('No takenAt date, skipping match');
      return { autoMatched: null, suggestions: [] };
    }

    // Find user's concerts within date range
    // Use wider window (±10 days) to catch multi-day festivals
    // datesMatch() will do precise filtering with dynamic buffer
    const searchStart = new Date(takenAt);
    searchStart.setDate(searchStart.getDate() - 10);
    const searchEnd = new Date(takenAt);
    searchEnd.setDate(searchEnd.getDate() + 10);

    const concerts = await prisma.concert.findMany({
      where: {
        userId,
        OR: [
          // Single-day events: concertDate within search window
          { concertDate: { gte: searchStart, lte: searchEnd } },
          // Multi-day events: media might fall within [concertDate, concertEndDate]
          {
            AND: [
              { concertDate: { lte: searchEnd } },
              { concertEndDate: { gte: searchStart } },
            ],
          },
        ],
      },
      include: {
        venue: true,
        artists: { include: { artist: true } },
      },
    });

    if (concerts.length === 0) {
      logger.debug('No concerts in date range', { userId, takenAt });
      return { autoMatched: null, suggestions: [] };
    }

    // Score each concert
    const matches: ConcertMatch[] = [];

    for (const concert of concerts) {
      const signalResults = {
        gpsMatch: false,
        dateMatch: false,
        venueMatch: false,
        artistMatch: false,
        setlistConfirmed: false,
      };

      // Date check (supports multi-day events via concertEndDate)
      signalResults.dateMatch = datesMatch(takenAt, concert.concertDate, concert.concertEndDate);

      // GPS check via setlist.fm
      // setlistService.findByLocation already verified media GPS is within 2km of a venue
      // with an event on that date, so if we have a setlistMatch, GPS is implicitly confirmed
      if (locationLat && locationLng && setlistMatch) {
        signalResults.gpsMatch = true;
      }

      // Venue name check (also consider city for additional confidence)
      const venueNameFromAnalysis = visualAnalysis?.venue?.name;
      const venueNameFromSetlist = setlistMatch?.venueName;
      const concertVenueName = concert.venue?.name;
      const concertVenueCity = concert.venue?.city;

      const venueNameMatches = stringsMatch(venueNameFromAnalysis, concertVenueName) ||
                               stringsMatch(venueNameFromSetlist, concertVenueName);
      const venueCityMatches = stringsMatch(setlistMatch?.city, concertVenueCity) ||
                               stringsMatch(visualAnalysis?.venue?.city, concertVenueCity);

      if (venueNameMatches || (venueCityMatches && (venueNameFromAnalysis || venueNameFromSetlist))) {
        signalResults.venueMatch = true;
      }

      // Artist check
      const artistFromAnalysis = visualAnalysis?.artist?.name;
      const artistsFromSetlist = setlistMatch?.artists?.map(a => a.name) || [];
      const concertArtists = concert.artists.map(ca => ca.artist.name);

      for (const concertArtist of concertArtists) {
        if (stringsMatch(artistFromAnalysis, concertArtist) ||
            artistsFromSetlist.some(name => stringsMatch(name, concertArtist))) {
          signalResults.artistMatch = true;
          break;
        }
      }

      // Setlist confirmation (setlist exists and we have a date match)
      // Note: setlistMatch was already filtered by date in setlistService.findByLocation
      if (setlistMatch && signalResults.dateMatch) {
        signalResults.setlistConfirmed = true;
      }

      // Calculate confidence
      const { confidence, matchedVia } = calculateConfidence({
        ...signalResults,
        visualConfidence: visualAnalysis?.overallConfidence || 0,
      });

      if (confidence >= SUGGESTION_THRESHOLD) {
        matches.push({
          concertId: concert.id,
          metadata: {
            confidence,
            signals: signalResults,
            matchedVia,
          },
        });
      }
    }

    // Sort by confidence descending
    matches.sort((a, b) => b.metadata.confidence - a.metadata.confidence);

    // Determine auto-match vs suggestions
    const topMatch = matches[0];

    if (topMatch && topMatch.metadata.confidence >= AUTO_MATCH_THRESHOLD) {
      logger.info('Auto-matching media to concert', {
        concertId: topMatch.concertId,
        confidence: topMatch.metadata.confidence,
        matchedVia: topMatch.metadata.matchedVia,
      });

      return {
        autoMatched: topMatch,
        suggestions: matches.slice(1),
      };
    }

    logger.debug('No auto-match, returning suggestions', {
      count: matches.length,
      topConfidence: topMatch?.metadata.confidence,
    });

    return {
      autoMatched: null,
      suggestions: matches,
    };
  },

  /**
   * Apply match to media record and store metadata
   */
  async applyMatch(mediaId: string, match: ConcertMatch): Promise<void> {
    const existingMedia = await prisma.media.findUnique({
      where: { id: mediaId },
      select: { aiAnalysis: true },
    });

    const existingAnalysis = (existingMedia?.aiAnalysis as Record<string, unknown>) || {};

    await prisma.media.update({
      where: { id: mediaId },
      data: {
        concertId: match.concertId,
        // Store match metadata in aiAnalysis for transparency
        aiAnalysis: {
          ...existingAnalysis,
          matchMetadata: {
            confidence: match.metadata.confidence,
            signals: match.metadata.signals,
            matchedVia: match.metadata.matchedVia,
          },
        },
      },
    });

    logger.info('Applied concert match', {
      mediaId,
      concertId: match.concertId,
      confidence: match.metadata.confidence,
    });
  },
};
