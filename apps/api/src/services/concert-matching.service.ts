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
const SUGGESTION_THRESHOLD = 0.35;


export interface MatchSignals {
  userId: string;
  takenAt: Date | null;
  locationLat: number | null;
  locationLng: number | null;
  visualAnalysis: PhotoAnalysis | null;
}

export interface MatchMetadata {
  confidence: number;
  signals: {
    gpsMatch: boolean;
    dateMatch: boolean;
    venueMatch: boolean;
    artistMatch: boolean;
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
// GPS Distance (Haversine formula)
// ─────────────────────────────────────────────────────────────────────────────

const GPS_MATCH_RADIUS_KM = 5;

/**
 * Calculate great-circle distance between two GPS coordinates
 * @returns Distance in kilometers
 */
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

  // Dynamic buffer: ceil(eventDays / 2), minimum 1.5 days
  // 1.5 days covers all timezone interpretations of a calendar date globally
  const bufferDays = Math.max(1.5, Math.ceil(eventDays / 2));
  const bufferMs = bufferDays * msPerDay;

  const rangeStart = startDate.getTime() - bufferMs;
  const rangeEnd = effectiveEnd.getTime() + bufferMs;
  const mediaTime = mediaDate.getTime();

  return mediaTime >= rangeStart && mediaTime <= rangeEnd;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scoring Logic
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate match confidence score based on available signals
 *
 * Scoring rationale:
 * - GPS + date is near-certain (0.95) - you were physically there
 * - Venue + artist + date is strong - multiple confirmations
 * - Single signals are weaker and stack
 */
function calculateConfidence(
  signals: MatchMetadata['signals'],
  visualConfidence: number
): { confidence: number; matchedVia: string } {
  const { gpsMatch, dateMatch, venueMatch, artistMatch } = signals;

  // Tier 1: GPS + date = near certain
  if (gpsMatch && dateMatch) {
    return { confidence: 0.95, matchedVia: 'gps+date' };
  }

  // Tier 2: Multiple signals stacking
  let score = 0;
  const matchedSignals: string[] = [];

  if (dateMatch) {
    score += 0.35;
    matchedSignals.push('date');
  }

  if (venueMatch) {
    score += 0.30;
    matchedSignals.push('venue');
  }

  if (artistMatch) {
    score += 0.25;
    matchedSignals.push('artist');
  }

  // Visual confidence acts as a multiplier on artist/venue matches
  if ((venueMatch || artistMatch) && visualConfidence > 0) {
    score *= (0.7 + visualConfidence * 0.3);
  }

  return {
    confidence: Math.min(score, 0.94), // Cap below Tier 1
    matchedVia: matchedSignals.join('+') || 'none',
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
    const { userId, takenAt, locationLat, locationLng, visualAnalysis } = signals;

    logger.info('Finding matches', { userId, takenAt, hasGps: !!(locationLat && locationLng) });

    // Need at least a date to attempt matching
    if (!takenAt) {
      logger.info('No takenAt date, skipping match');
      return { autoMatched: null, suggestions: [] };
    }

    // Find user's concerts within date range
    // Use wider window (±10 days) to catch multi-day festivals
    // datesMatch() will do precise filtering with dynamic buffer
    const searchStart = new Date(takenAt);
    searchStart.setDate(searchStart.getDate() - 10);
    const searchEnd = new Date(takenAt);
    searchEnd.setDate(searchEnd.getDate() + 10);

    logger.info('Searching concerts', { searchStart, searchEnd });

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

    logger.info('Found concerts in search window', { count: concerts.length });

    if (concerts.length === 0) {
      logger.info('No concerts in date range', { userId, takenAt });
      return { autoMatched: null, suggestions: [] };
    }

    // Score each concert
    const matches: ConcertMatch[] = [];

    for (const concert of concerts) {
      const signalResults: MatchMetadata['signals'] = {
        gpsMatch: false,
        dateMatch: false,
        venueMatch: false,
        artistMatch: false,
      };

      // Date check (supports multi-day events via concertEndDate)
      signalResults.dateMatch = datesMatch(takenAt, concert.concertDate, concert.concertEndDate);

      logger.info('Checking concert', {
        concertId: concert.id,
        concertDate: concert.concertDate,
        concertEndDate: concert.concertEndDate,
        mediaDate: takenAt,
        dateMatch: signalResults.dateMatch,
      });

      // GPS check: Compare media GPS to venue GPS (if venue has coordinates)
      if (locationLat && locationLng && concert.venue?.latitude && concert.venue?.longitude) {
        const distance = haversine(
          locationLat,
          locationLng,
          Number(concert.venue.latitude),
          Number(concert.venue.longitude)
        );
        if (distance <= GPS_MATCH_RADIUS_KM) {
          signalResults.gpsMatch = true;
          logger.debug('GPS match', {
            concertId: concert.id,
            venueName: concert.venue.name,
            distance: distance.toFixed(2) + 'km',
          });
        }
      }

      // Venue name check (from Claude visual analysis)
      const venueNameFromAnalysis = visualAnalysis?.venue?.name;
      const venueCityFromAnalysis = visualAnalysis?.venue?.city;
      const concertVenueName = concert.venue?.name;
      const concertVenueCity = concert.venue?.city;

      const venueNameMatches = stringsMatch(venueNameFromAnalysis, concertVenueName);
      const venueCityMatches = stringsMatch(venueCityFromAnalysis, concertVenueCity);

      if (venueNameMatches || (venueCityMatches && venueNameFromAnalysis)) {
        signalResults.venueMatch = true;
      }

      // Artist check (from Claude visual analysis)
      const artistFromAnalysis = visualAnalysis?.artist?.name;
      const concertArtists = concert.artists.map(ca => ca.artist.name);

      for (const concertArtist of concertArtists) {
        if (stringsMatch(artistFromAnalysis, concertArtist)) {
          signalResults.artistMatch = true;
          break;
        }
      }

      // Calculate confidence
      const { confidence, matchedVia } = calculateConfidence(
        signalResults,
        visualAnalysis?.overallConfidence || 0
      );

      logger.info('Concert score', {
        concertId: concert.id,
        confidence,
        matchedVia,
        signals: signalResults,
        meetsThreshold: confidence >= SUGGESTION_THRESHOLD,
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

    logger.info('No auto-match, returning suggestions', {
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
