'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Venue } from '@encore/shared';

export interface VenueCardProps {
  venue: Venue & { concertCount?: number };
  onClick?: () => void;
}

export function VenueCard({ venue, onClick }: VenueCardProps) {
  const location = [venue.city, venue.state, venue.country]
    .filter(Boolean)
    .join(', ');

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={onClick}
    >
      <div className="flex flex-col h-full">
        {/* Venue Icon */}
        <div className="flex items-center justify-center h-32 bg-gradient-to-br from-primary-100 to-primary-200 rounded-t-lg -mx-6 -mt-6 mb-4">
          <svg
            className="h-16 w-16 text-primary-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>

        {/* Venue Name */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {venue.name}
        </h3>

        {/* Location */}
        {location && (
          <p className="text-sm text-gray-600 mb-3 flex items-center gap-1.5">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {location}
          </p>
        )}

        {/* Concert Count */}
        {venue.concertCount !== undefined && (
          <div className="mt-auto pt-3 border-t border-gray-200">
            <Badge variant="info">
              {venue.concertCount} {venue.concertCount === 1 ? 'concert' : 'concerts'}
            </Badge>
          </div>
        )}

        {/* Capacity */}
        {venue.capacity && (
          <p className="text-sm text-gray-500 mt-2">
            Capacity: {venue.capacity.toLocaleString()}
          </p>
        )}
      </div>
    </Card>
  );
}
