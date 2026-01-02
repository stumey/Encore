'use client';

import { useEffect, useState } from 'react';
import { useMediaItem, useAssignMediaToConcert } from '@/lib/api/hooks/use-media';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

interface UploadReviewProps {
  mediaIds: string[];
  onComplete: () => void;
}

/**
 * Post-upload review component
 *
 * Polls each uploaded media item for analysis completion,
 * shows match suggestions, and allows user to confirm/change assignments.
 */
export function UploadReview({ mediaIds, onComplete }: UploadReviewProps) {
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());

  const allReviewed = reviewed.size === mediaIds.length;

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Reviewing Your Uploads
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {reviewed.size} of {mediaIds.length} reviewed
          </p>
        </div>
        <Button
          variant="primary"
          onClick={onComplete}
          disabled={!allReviewed}
        >
          {allReviewed ? 'Done' : `${mediaIds.length - reviewed.size} remaining`}
        </Button>
      </div>

      <div className="space-y-3">
        {mediaIds.map((id) => (
          <UploadReviewItem
            key={id}
            mediaId={id}
            onReviewed={() => setReviewed(prev => new Set([...prev, id]))}
            isReviewed={reviewed.has(id)}
          />
        ))}
      </div>

      {allReviewed && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 text-center">
          <p className="text-sm text-green-600 dark:text-green-400">
            All uploads reviewed!
          </p>
        </div>
      )}
    </div>
  );
}

interface UploadReviewItemProps {
  mediaId: string;
  onReviewed: () => void;
  isReviewed: boolean;
}

function UploadReviewItem({ mediaId, onReviewed, isReviewed }: UploadReviewItemProps) {
  const { data: media, isLoading } = useMediaItem(mediaId);
  const assignMutation = useAssignMediaToConcert();
  const [dismissed, setDismissed] = useState(false);

  const isAnalyzing = media?.analysisStatus === 'processing';
  const isComplete = media?.analysisStatus === 'completed';
  const hasConcert = !!media?.concertId;
  const hasSuggestions = (media?.matchSuggestions?.length ?? 0) > 0;
  const topSuggestion = media?.matchSuggestions?.[0];

  // Auto-mark as reviewed when auto-matched or no suggestions
  useEffect(() => {
    if (!isReviewed && isComplete) {
      if (hasConcert || (!hasSuggestions && !dismissed)) {
        onReviewed();
      }
    }
  }, [isComplete, hasConcert, hasSuggestions, isReviewed, dismissed, onReviewed]);

  const handleAccept = async (concertId: string) => {
    await assignMutation.mutateAsync({ mediaId, concertId });
    onReviewed();
  };

  const handleSkip = () => {
    setDismissed(true);
    onReviewed();
  };

  if (isLoading || !media) {
    return (
      <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg animate-pulse">
        <div className="h-12 w-12 bg-gray-200 dark:bg-slate-600 rounded" />
        <div className="flex-1">
          <div className="h-4 w-32 bg-gray-200 dark:bg-slate-600 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
      {/* Thumbnail */}
      <div className="flex-shrink-0 h-12 w-12 bg-gray-200 dark:bg-slate-600 rounded overflow-hidden">
        {media.thumbnailUrl || media.downloadUrl ? (
          <img
            src={media.thumbnailUrl || media.downloadUrl}
            alt={media.originalFilename || 'Media'}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {media.originalFilename || 'Untitled'}
        </p>

        {/* Status */}
        {isAnalyzing && (
          <div className="flex items-center gap-2 mt-1">
            <Spinner size="sm" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Analyzing...</span>
          </div>
        )}

        {isComplete && hasConcert && media.concert && (
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="success" className="text-xs">Linked</Badge>
            <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
              {media.concert.artists?.[0]?.artist?.name || 'Concert'} - {formatDate(media.concert.concertDate)}
            </span>
          </div>
        )}

        {isComplete && !hasConcert && hasSuggestions && !dismissed && topSuggestion?.concert && (
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
            Match found: {topSuggestion.concert.artists.join(', ')} at {topSuggestion.concert.venue}
          </p>
        )}

        {isComplete && !hasConcert && !hasSuggestions && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            No concert match found
          </p>
        )}

        {dismissed && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Skipped - assign later from gallery
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-2">
        {isComplete && !hasConcert && hasSuggestions && !dismissed && topSuggestion && (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleAccept(topSuggestion.concertId)}
              loading={assignMutation.isPending}
              disabled={assignMutation.isPending}
            >
              Confirm
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              disabled={assignMutation.isPending}
            >
              Skip
            </Button>
          </>
        )}

        {isComplete && hasConcert && (
          <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}

        {isComplete && !hasConcert && (!hasSuggestions || dismissed) && (
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </div>
  );
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
