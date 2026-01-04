'use client';

import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ArtistWithCount } from '@encore/shared';

export interface ArtistCardProps {
  artist: ArtistWithCount;
  onClick?: () => void;
}

export function ArtistCard({ artist, onClick }: ArtistCardProps) {
  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={onClick}
      noPadding
    >
      <div className="p-6">
        <div className="flex flex-col items-center text-center">
          {/* Artist Image */}
          <Avatar
            src={artist.artist.imageUrl || undefined}
            name={artist.artist.name}
            size="xl"
            className="mb-4"
          />

          {/* Artist Name */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {artist.artist.name}
          </h3>

          {/* Times Seen Badge */}
          <Badge variant="info" className="mb-4">
            {artist.concertCount} {artist.concertCount === 1 ? 'concert' : 'concerts'}
          </Badge>

          {/* Genres */}
          {artist.artist.genres && artist.artist.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4 justify-center">
              {artist.artist.genres.slice(0, 3).map((genre) => (
                <Badge key={genre} variant="default">
                  {genre}
                </Badge>
              ))}
            </div>
          )}

          {/* Dates */}
          <div className="w-full border-t border-gray-200 pt-4 mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">First seen:</span>
              <span className="text-gray-900 font-medium">
                {formatDate(artist.firstSeen)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Last seen:</span>
              <span className="text-gray-900 font-medium">
                {formatDate(artist.lastSeen)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
