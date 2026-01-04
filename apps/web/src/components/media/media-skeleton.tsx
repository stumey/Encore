'use client';

import { Skeleton } from '@/components/ui';

/**
 * Skeleton for individual media grid items
 */
export function MediaItemSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div
      className="opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="aspect-square bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>
    </div>
  );
}

/**
 * Skeleton grid for media gallery loading state
 */
export function MediaGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <MediaItemSkeleton key={index} index={index} />
      ))}
    </div>
  );
}

/**
 * Full media page skeleton including header
 */
export function MediaPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="w-32 h-9 mb-2" />
            <Skeleton className="w-24 h-5" />
          </div>
          <Skeleton className="w-36 h-11 rounded-lg" />
        </div>

        {/* Tabs Skeleton */}
        <div className="mb-6">
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="w-20 h-9 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Grid Skeleton */}
        <MediaGridSkeleton count={12} />
      </div>
    </div>
  );
}
