'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo, useCallback } from 'react';
import { useArtist, useArtistMedia } from '@/lib/api';
import { DashboardSection } from '@/components/layout';
import {
  Avatar,
  Badge,
  Button,
  Card,
  
  
  CardContent,
  Spinner,
  EmptyState,
} from '@/components/ui';
import type { ArtistWithCount } from '@encore/shared';

/**
 * Artist Detail Page
 *
 * Displays comprehensive information about a specific artist:
 * - Artist header with image, name, genres, Genius link
 * - Statistics (times seen, first/last seen dates)
 * - List of concerts where the user saw this artist
 * - Media gallery from all concerts
 * - Link to fetch setlists from Setlist.fm
 */
export default function ArtistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const artistId = params.id as string;

  const { data: artistData, isLoading, error } = useArtist(artistId);
  const { data: mediaData, isLoading: isLoadingMedia } = useArtistMedia(artistId);

  /**
   * Calculate artist statistics from concert data
   * Uses memoization to prevent unnecessary recalculations
   */
  const artistWithCount = useMemo((): ArtistWithCount | null => {
    if (!artistData) return null;

    const concerts = artistData.concerts || [];
    const dates = concerts
      .map((ca) => new Date(ca.concert.concertDate))
      .filter((date) => !isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    return {
      artist: artistData,
      concertCount: concerts.length,
      firstSeen: dates.length > 0 ? dates[0].toISOString() : null,
      lastSeen: dates.length > 0 ? dates[dates.length - 1].toISOString() : null,
    };
  }, [artistData]);

  /**
   * Sort concerts by date (most recent first)
   */
  const sortedConcerts = useMemo(() => {
    if (!artistData?.concerts) return [];
    return [...artistData.concerts].sort(
      (a, b) =>
        new Date(b.concert.concertDate).getTime() -
        new Date(a.concert.concertDate).getTime()
    );
  }, [artistData?.concerts]);

  /**
   * Format date to readable string
   */
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    []
  );

  const formatDate = useCallback(
    (date: Date | string) => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateFormatter.format(dateObj);
    },
    [dateFormatter]
  );

  /**
   * Navigation handlers
   */
  const handleConcertClick = useCallback((concertId: string) => {
    router.push(`/concerts/${concertId}`);
  }, [router]);

  const handleVenueClick = useCallback((venueId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/venues/${venueId}`);
  }, [router]);

  const handleGeniusClick = useCallback(() => {
    if (artistData?.geniusId) {
      window.open(`https://genius.com/artists/${artistData.geniusId}`, '_blank');
    }
  }, [artistData?.geniusId]);

  const handleSetlistFmClick = useCallback(() => {
    if (artistData?.mbid) {
      window.open(`https://www.setlist.fm/setlists/${artistData.mbid}.html`, '_blank');
    } else if (artistData?.name) {
      const searchQuery = encodeURIComponent(artistData.name);
      window.open(`https://www.setlist.fm/search?query=${searchQuery}`, '_blank');
    }
  }, [artistData?.mbid, artistData?.name]);

  // Loading state
  if (isLoading || !artistData || !artistWithCount) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Spinner size="lg" className="text-purple-600" />
          <p className="mt-4 text-gray-600">Loading artist...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          title="Error Loading Artist"
          description="There was an error loading this artist. Please try refreshing the page."
          action={{
            label: 'Refresh Page',
            onClick: () => window.location.reload(),
          }}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Artists
      </Button>

      {/* Artist Header */}
      <Card className="mb-8">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar
              src={artistData.imageUrl || undefined}
              name={artistData.name}
              size="xl"
              className="h-32 w-32"
            />

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                {artistData.name}
              </h1>

              {/* Genres */}
              {artistData.genres && artistData.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 justify-center md:justify-start">
                  {artistData.genres.map((genre) => (
                    <Badge key={genre} variant="default">
                      {genre}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 flex-wrap justify-center md:justify-start">
                {artistData.geniusId && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleGeniusClick}
                  >
                    <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 6.627 5.373 12 12 12s12-5.373 12-12c0-6.627-5.373-12-12-12zm-1.5 18.25l-.083-.005c-1.125-.075-2.123-.667-2.658-1.578-.535-.911-.532-2.03.006-2.981l2.396-4.238c.196-.347.628-.466.963-.265.335.201.448.642.252.989l-2.396 4.238c-.269.476-.271 1.035-.003 1.49.268.455.744.753 1.27.793.526.041 1.042-.184 1.375-.597l3.75-4.688c.232-.29.655-.337.945-.105.29.232.337.655.105.945l-3.75 4.688c-.556.694-1.394 1.12-2.293 1.165-.026.001-.053.002-.079.002-.379 0-.751-.078-1.094-.228z"/>
                    </svg>
                    View on Genius
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSetlistFmClick}
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  View Setlists
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <DashboardSection>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Times Seen</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {artistWithCount.concertCount}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">First Seen</p>
                <p className="text-lg font-semibold text-gray-900 mt-2">
                  {artistWithCount.firstSeen
                    ? new Date(artistWithCount.firstSeen).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Last Seen</p>
                <p className="text-lg font-semibold text-gray-900 mt-2">
                  {artistWithCount.lastSeen
                    ? new Date(artistWithCount.lastSeen).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardSection>

      {/* Concerts List */}
      <DashboardSection title="Concerts" description={`All concerts where you saw ${artistData.name}`}>
        <Card>
          <CardContent>
            {sortedConcerts.length > 0 ? (
              <div className="space-y-4">
                {sortedConcerts.map((concertArtist) => (
                  <div
                    key={concertArtist.concertId}
                    className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => handleConcertClick(concertArtist.concertId)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">
                          {formatDate(concertArtist.concert.concertDate)}
                        </h4>
                        {concertArtist.isHeadliner && (
                          <Badge variant="warning">Headliner</Badge>
                        )}
                      </div>
                      {concertArtist.concert.venue && (
                        <button
                          onClick={(e) => handleVenueClick(concertArtist.concert.venue!.id, e)}
                          className="text-sm text-gray-600 hover:text-purple-600 transition-colors text-left"
                        >
                          {concertArtist.concert.venue.name}
                          {concertArtist.concert.venue.city && (
                            <span> - {concertArtist.concert.venue.city}</span>
                          )}
                        </button>
                      )}
                      {concertArtist.concert.tourName && (
                        <p className="text-sm text-gray-500 mt-1">
                          {concertArtist.concert.tourName}
                        </p>
                      )}
                    </div>
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Concerts"
                description="No concert data available for this artist."
              />
            )}
          </CardContent>
        </Card>
      </DashboardSection>

      {/* Media Gallery */}
      <DashboardSection title="Media Gallery" description="Photos and videos from all concerts">
        <Card>
          <CardContent>
            {isLoadingMedia ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : mediaData && mediaData.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {mediaData.map((media) => (
                  <div
                    key={media.id}
                    className="aspect-square rounded-lg overflow-hidden bg-gray-200 hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    {media.mediaType === 'photo' ? (
                      <img
                        src={media.thumbnailUrl || media.downloadUrl}
                        alt="Concert media"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-700">
                        <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Media"
                description="No photos or videos have been uploaded for this artist yet."
                icon={
                  <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />
            )}
          </CardContent>
        </Card>
      </DashboardSection>
    </div>
  );
}
