'use client';

import { Skeleton, StatCardSkeleton, ConcertCardSkeleton } from '@/components/ui';

/**
 * Dashboard Skeleton Loading State
 *
 * Displays a skeleton layout matching the dashboard structure.
 * Uses staggered animations for a polished loading experience.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Page Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="w-64 h-8 mb-2" />
          <Skeleton className="w-80 h-5" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="w-32 h-10 rounded-lg" />
          <Skeleton className="w-32 h-10 rounded-lg" />
        </div>
      </div>

      {/* Stats Grid Skeleton with staggered animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="opacity-0 animate-fade-in-up"
            style={{ animationDelay: `${index * 75}ms` }}
          >
            <StatCardSkeleton />
          </div>
        ))}
      </div>

      {/* Most Seen Artist Skeleton */}
      <div>
        <Skeleton className="w-40 h-6 mb-2" />
        <Skeleton className="w-64 h-4 mb-4" />
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-6">
            <Skeleton variant="circular" className="w-16 h-16" />
            <div className="flex-1">
              <Skeleton className="w-48 h-7 mb-2" />
              <Skeleton className="w-24 h-4" />
            </div>
            <Skeleton className="w-24 h-9 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Recent Concerts Skeleton */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <Skeleton className="w-36 h-6 mb-2" />
            <Skeleton className="w-48 h-4" />
          </div>
          <Skeleton className="w-20 h-8 rounded-lg" />
        </div>
        <div className="space-y-4">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${300 + index * 100}ms` }}
            >
              <ConcertCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
