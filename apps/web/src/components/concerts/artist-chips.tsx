'use client';

import { Artist, ConcertArtist } from '@encore/shared';
import { Badge } from '@/components/ui/badge';

export interface ArtistChipsProps {
  artists: (ConcertArtist & { artist: Artist })[];
  className?: string;
  showHeadlinerBadge?: boolean;
}

export function ArtistChips({
  artists,
  className = '',
  showHeadlinerBadge = true,
}: ArtistChipsProps) {
  // Sort artists - headliners first, then by setOrder
  const sortedArtists = [...artists].sort((a, b) => {
    if (a.isHeadliner && !b.isHeadliner) return -1;
    if (!a.isHeadliner && b.isHeadliner) return 1;
    if (a.setOrder !== null && b.setOrder !== null) {
      return a.setOrder - b.setOrder;
    }
    return 0;
  });

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {sortedArtists.map(({ artist, isHeadliner }) => (
        <div key={artist.id} className="flex items-center gap-1.5">
          <Badge
            variant={isHeadliner ? 'info' : 'default'}
            className="flex items-center gap-1.5"
          >
            {artist.imageUrl && (
              <img
                src={artist.imageUrl}
                alt={artist.name}
                className="h-4 w-4 rounded-full object-cover"
              />
            )}
            <span>{artist.name}</span>
          </Badge>
          {showHeadlinerBadge && isHeadliner && (
            <Badge variant="success" className="text-xs">
              Headliner
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}
