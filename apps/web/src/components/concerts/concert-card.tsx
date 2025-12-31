'use client';

import { ConcertWithDetails } from '@encore/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArtistChips } from './artist-chips';
import Link from 'next/link';

export interface ConcertCardProps {
  concert: ConcertWithDetails;
  className?: string;
}

export function ConcertCard({ concert, className = '' }: ConcertCardProps) {
  const concertDate = new Date(concert.concertDate);
  const formattedDate = concertDate.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Get thumbnail from first media item or headliner artist
  const thumbnail = concert.media?.[0]?.thumbnailPath ||
    concert.artists.find(a => a.isHeadliner)?.artist.imageUrl ||
    concert.artists[0]?.artist.imageUrl;

  const mediaCount = concert._count?.media || concert.media?.length || 0;

  return (
    <Link href={`/concerts/${concert.id}`}>
      <Card className={`hover:shadow-lg transition-all duration-200 cursor-pointer group ${className}`}>
        <CardContent className="p-0">
          {/* Thumbnail */}
          <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200 rounded-t-lg overflow-hidden">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={concert.artists[0]?.artist.name || 'Concert'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg
                  className="h-16 w-16 text-primary-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
              </div>
            )}

            {/* Badges overlay */}
            <div className="absolute top-2 right-2 flex flex-col gap-1.5">
              {concert.isVerified && (
                <Badge variant="success" className="shadow-sm">
                  Verified
                </Badge>
              )}
              {mediaCount > 0 && (
                <Badge variant="default" className="shadow-sm">
                  {mediaCount} {mediaCount === 1 ? 'photo' : 'photos'}
                </Badge>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Date */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="font-medium">{formattedDate}</span>
            </div>

            {/* Artists */}
            <div>
              <ArtistChips
                artists={concert.artists}
                showHeadlinerBadge={false}
              />
            </div>

            {/* Venue */}
            {concert.venue && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <svg
                  className="h-4 w-4 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{concert.venue.name}</div>
                  {(concert.venue.city || concert.venue.state) && (
                    <div className="text-xs text-gray-500">
                      {[concert.venue.city, concert.venue.state]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tour */}
            {concert.tourName && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <span className="italic">{concert.tourName}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
