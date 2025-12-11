'use client';

import { Badge } from '@/components/ui/badge';
import type { AiAnalysis } from '@encore/shared';

export interface AiAnalysisCardProps {
  analysis: AiAnalysis;
}

/**
 * AI Analysis Card Component
 *
 * Displays AI-detected information from media analysis:
 * - Artist detection with confidence score
 * - Venue detection with confidence score
 * - Tour name detection
 * - Estimated date
 * - AI reasoning
 */
export function AiAnalysisCard({ analysis }: AiAnalysisCardProps) {
  const { artist, venue, tour, estimatedDate, overallConfidence, reasoning } = analysis;

  /**
   * Get confidence badge variant based on score
   */
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.5) return 'warning';
    return 'error';
  };

  /**
   * Format confidence as percentage
   */
  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          AI Analysis
        </h4>
        <Badge variant={getConfidenceBadge(overallConfidence)}>
          {formatConfidence(overallConfidence)} confident
        </Badge>
      </div>

      {/* Artist Detection */}
      {artist.name && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Artist Detected
            </p>
            <Badge variant={getConfidenceBadge(artist.confidence)} className="text-xs">
              {formatConfidence(artist.confidence)}
            </Badge>
          </div>
          <p className="text-sm font-medium text-gray-900">{artist.name}</p>
          {artist.clues.length > 0 && (
            <ul className="text-xs text-gray-600 space-y-1 mt-2">
              {artist.clues.map((clue, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">"</span>
                  <span>{clue}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Venue Detection */}
      {venue.name && (
        <div className="space-y-1 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Venue Detected
            </p>
            <Badge variant={getConfidenceBadge(venue.confidence)} className="text-xs">
              {formatConfidence(venue.confidence)}
            </Badge>
          </div>
          <p className="text-sm font-medium text-gray-900">
            {venue.name}
            {venue.city && ` - ${venue.city}`}
          </p>
          <p className="text-xs text-gray-500">{venue.type}</p>
          {venue.clues.length > 0 && (
            <ul className="text-xs text-gray-600 space-y-1 mt-2">
              {venue.clues.map((clue, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">"</span>
                  <span>{clue}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Tour Detection */}
      {tour.name && (
        <div className="space-y-1 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Tour Detected
            </p>
            <Badge variant={getConfidenceBadge(tour.confidence)} className="text-xs">
              {formatConfidence(tour.confidence)}
            </Badge>
          </div>
          <p className="text-sm font-medium text-gray-900">{tour.name}</p>
          {tour.clues.length > 0 && (
            <ul className="text-xs text-gray-600 space-y-1 mt-2">
              {tour.clues.map((clue, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">"</span>
                  <span>{clue}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Estimated Date */}
      {estimatedDate && (
        <div className="space-y-1 pt-3 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Estimated Date
          </p>
          <p className="text-sm font-medium text-gray-900">
            {new Date(estimatedDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      )}

      {/* Reasoning */}
      {reasoning && (
        <div className="space-y-1 pt-3 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            AI Reasoning
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">{reasoning}</p>
        </div>
      )}
    </div>
  );
}
