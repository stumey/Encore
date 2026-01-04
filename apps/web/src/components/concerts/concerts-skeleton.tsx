'use client';

import { Skeleton } from '@/components/ui';

/**
 * Skeleton for individual concert cards
 */
export function ConcertCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div
      className="opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${index * 75}ms` }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden">
        {/* Image placeholder */}
        <Skeleton className="w-full h-48" />

        {/* Content */}
        <div className="p-4">
          {/* Artist name */}
          <Skeleton className="w-3/4 h-6 mb-2" />

          {/* Venue */}
          <div className="flex items-center gap-2 mb-2">
            <Skeleton variant="circular" className="w-4 h-4" />
            <Skeleton className="w-1/2 h-4" />
          </div>

          {/* Date */}
          <div className="flex items-center gap-2">
            <Skeleton variant="circular" className="w-4 h-4" />
            <Skeleton className="w-1/3 h-4" />
          </div>

          {/* Tags */}
          <div className="flex gap-2 mt-3">
            <Skeleton className="w-16 h-5 rounded-full" />
            <Skeleton className="w-20 h-5 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton grid for concerts page loading state
 */
export function ConcertsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ConcertCardSkeleton key={index} index={index} />
      ))}
    </div>
  );
}

/**
 * Full concerts page skeleton including header
 */
export function ConcertsPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="w-40 h-9 mb-2" />
              <Skeleton className="w-28 h-5" />
            </div>
            <Skeleton className="w-36 h-11 rounded-lg" />
          </div>

          {/* Search and Filters Skeleton */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Skeleton className="w-full h-10 rounded-lg" />
            </div>
            <Skeleton className="w-full h-10 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ConcertsGridSkeleton count={6} />
      </div>
    </div>
  );
}
