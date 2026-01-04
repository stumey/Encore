'use client';

import Link from 'next/link';
import { useOnThisDay } from '@/lib/api/hooks/use-on-this-day';
import { DashboardSection } from '@/components/layout';
import { Card, CardContent, Badge, Avatar, Spinner } from '@/components/ui';

/**
 * "On This Day" Component
 *
 * Shows concerts that happened on the same month/day in previous years.
 * Creates a nostalgic "memory" experience similar to social media features.
 * Only renders if there are matching concerts.
 */
export function OnThisDay() {
  const { data: concerts, isLoading } = useOnThisDay();

  // Don't render anything while loading or if no matches
  if (isLoading) {
    return (
      <DashboardSection title="On This Day" description="Loading memories...">
        <div className="flex justify-center py-8">
          <Spinner size="md" />
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

  return (
    <DashboardSection
      title="On This Day"
      description={`${concerts.length} ${concerts.length === 1 ? 'memory' : 'memories'} from your past`}
    >
      <div className="bg-gradient-to-r from-primary-50 to-orange-50 dark:from-primary-950/50 dark:to-orange-950/50 rounded-xl border border-primary-100 dark:border-primary-800 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-primary-600 to-orange-500 px-6 py-3">
          <div className="flex items-center gap-2 text-white">
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
