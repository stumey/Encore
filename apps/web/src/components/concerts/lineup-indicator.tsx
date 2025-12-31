'use client';

import { Spinner } from '@/components/ui/spinner';

interface LineupIndicatorProps {
  artistCount: number | null;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Subtle inline indicator shown when lineup data is found for a venue+date.
 * Shows loading state while fetching, success state with artist count,
 * or warning state if API fails.
 */
export function LineupIndicator({ artistCount, isLoading, isError }: LineupIndicatorProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-3">
        <Spinner size="sm" />
        <span>Checking for event lineup...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 mt-3">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span>Couldn&apos;t load event lineup from Setlist.fm</span>
      </div>
    );
  }

  if (!artistCount || artistCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 mt-3">
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>
        {artistCount} artist{artistCount !== 1 ? 's' : ''} found at this venue on this date
      </span>
    </div>
  );
}
