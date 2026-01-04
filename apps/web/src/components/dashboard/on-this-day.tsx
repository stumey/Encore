'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useOnThisDay } from '@/lib/api/hooks/use-on-this-day';
import { DashboardSection } from '@/components/layout';
import { Card, CardContent, Badge, Avatar, Skeleton } from '@/components/ui';

/**
 * "On This Day" Component
 *
 * Shows concerts that happened on the same month/day in previous years.
 * Creates a nostalgic "memory" experience similar to social media features.
 * Only renders if there are matching concerts.
 */
export function OnThisDay() {
  const { data: concerts, isLoading } = useOnThisDay();
  const [scrollY, setScrollY] = useState(0);

  // Subtle parallax effect for the banner
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Don't render anything while loading or if no matches
  if (isLoading) {
    return (
      <DashboardSection title="On This Day" description="Loading memories...">
        <div className="rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <Skeleton className="w-full h-12" />
          <div className="p-6 bg-gray-50 dark:bg-slate-800/50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <Skeleton variant="circular" className="w-12 h-12" />
                <div className="flex-1">
                  <Skeleton className="w-48 h-6 mb-2" />
                  <Skeleton className="w-32 h-4 mb-3" />
                  <div className="flex gap-2">
                    <Skeleton className="w-24 h-5 rounded-full" />
                    <Skeleton className="w-20 h-5 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardSection>
    );
  }

  if (!concerts || concerts.length === 0) {
    return null;
  }

  const featuredConcert = concerts[0];
  const concertDate = new Date(featuredConcert.concertDate);
  const yearsAgo = new Date().getFullYear() - concertDate.getFullYear();
  const artistNames = featuredConcert.artists.map((ca) => ca.artist.name).join(', ');

  // Calculate parallax offset (subtle, max 20px)
  const parallaxOffset = Math.min(scrollY * 0.1, 20);

  return (
    <DashboardSection
      title="On This Day"
      description={`${concerts.length} ${concerts.length === 1 ? 'memory' : 'memories'} from your past`}
    >
      <div className="bg-gradient-to-r from-primary-50 to-orange-50 dark:from-primary-950/50 dark:to-orange-950/50 rounded-xl border border-primary-100 dark:border-primary-800 overflow-hidden opacity-0 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        {/* Header Banner with Parallax */}
        <div
          className="bg-gradient-to-r from-primary-600 to-orange-500 px-6 py-3 relative overflow-hidden"
          style={{ transform: `translateY(${parallaxOffset}px)` }}
        >
          {/* Decorative background elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white rounded-full" />
            <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-white rounded-full" />
          </div>
          <div className="flex items-center gap-2 text-white relative z-10">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-semibold">
              {yearsAgo} {yearsAgo === 1 ? 'year' : 'years'} ago today
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <Link href={`/concerts/${featuredConcert.id}`} className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  {/* Artist Avatar */}
                  {featuredConcert.artists[0]?.artist.imageUrl ? (
                    <Avatar
                      src={featuredConcert.artists[0].artist.imageUrl}
                      name={featuredConcert.artists[0].artist.name}
                      size="lg"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                  )}

                  {/* Concert Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                      {artistNames}
                    </h3>

                    {featuredConcert.venue && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{featuredConcert.venue.name}</span>
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="info">
                        {concertDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          timeZone: 'UTC',
                        })}
                      </Badge>
                      {featuredConcert._count && featuredConcert._count.media > 0 && (
                        <Badge variant="secondary">
                          {featuredConcert._count.media} photo{featuredConcert._count.media !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* More Memories Link */}
          {concerts.length > 1 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center">
              +{concerts.length - 1} more {concerts.length - 1 === 1 ? 'memory' : 'memories'} from this day
            </p>
          )}
        </div>
      </div>
    </DashboardSection>
  );
}
