'use client';

import { use } from 'react';
import { useConcert, useDeleteConcert } from '@/lib/api/hooks/use-concerts';
import { useSetlist } from '@/lib/api/hooks/use-setlists';
import { useMedia } from '@/lib/api/hooks/use-media';
import { ArtistChips } from '@/components/concerts/artist-chips';
import { SetlistDisplay } from '@/components/concerts/setlist-display';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Modal, ModalFooter } from '@/components/ui/modal';

interface ConcertDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Concert Detail Page
 *
 * Displays comprehensive information about a single concert including:
 * - Concert header with date, venue, tour
 * - Artist lineup with headliner indication
 * - Setlist (if available)
 * - Media gallery
 * - Edit and delete actions
 */
export default function ConcertDetailPage({ params }: ConcertDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: concert, isLoading: concertLoading, error: concertError } = useConcert(id);
  const { data: setlist, isLoading: setlistLoading } = useSetlist(id);
  const { data: mediaData, isLoading: mediaLoading } = useMedia(1, 50, { concertId: id });

  const deleteConcert = useDeleteConcert();

  const handleDelete = async () => {
    try {
      await deleteConcert.mutateAsync(id);
      router.push('/concerts');
    } catch (error) {
      console.error('Failed to delete concert:', error);
    }
  };

  if (concertError) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error loading concert: {concertError.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (concertLoading || !concert) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const concertDate = new Date(concert.concertDate);
  const formattedDate = concertDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const media = mediaData?.data || [];
  const headlinerArtist = concert.artists.find(a => a.isHeadliner)?.artist || concert.artists[0]?.artist;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Button
                onClick={() => router.push('/concerts')}
                variant="ghost"
                size="sm"
                className="mb-4"
              >
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Concerts
              </Button>

              <div className="flex items-start gap-4">
                {headlinerArtist?.imageUrl && (
                  <img
                    src={headlinerArtist.imageUrl}
                    alt={headlinerArtist.name}
                    className="h-20 w-20 rounded-lg object-cover shadow-md"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {concert.artists[0]?.artist.name || 'Concert'}
                    </h1>
                    {concert.isVerified && (
                      <Badge variant="success" dot>
                        Verified
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 text-gray-600">
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-5 w-5"
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

                    {concert.venue && (
                      <div className="flex items-center gap-2">
                        <svg
                          className="h-5 w-5"
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
                        <span>
                          {concert.venue.name}
                          {(concert.venue.city || concert.venue.state) && (
                            <span className="text-gray-500">
                              {' '}• {[concert.venue.city, concert.venue.state].filter(Boolean).join(', ')}
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    {concert.tourName && (
                      <div className="flex items-center gap-2">
                        <svg
                          className="h-5 w-5"
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
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-4">
              <Button
                onClick={() => router.push(`/concerts/${id}/edit`)}
                variant="outline"
              >
                Edit
              </Button>
              <Button
                onClick={() => setShowDeleteModal(true)}
                variant="danger"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Artists Section */}
        <Card>
          <CardHeader>
            <CardTitle>Artists</CardTitle>
          </CardHeader>
          <CardContent>
            <ArtistChips artists={concert.artists} showHeadlinerBadge />
          </CardContent>
        </Card>

        {/* Notes Section */}
        {concert.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{concert.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Setlist Section */}
        <SetlistDisplay setlist={setlist || null} />

        {/* Media Gallery Section */}
        <Card>
          <CardHeader>
            <CardTitle>
              Media
              {media.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({media.length})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mediaLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : media.length === 0 ? (
              <p className="text-sm text-gray-500">No photos or videos from this concert yet.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {media.map((item) => (
                  <div
                    key={item.id}
                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group cursor-pointer"
                  >
                    <img
                      src={item.thumbnailUrl || item.downloadUrl}
                      alt={item.originalFilename || 'Concert media'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    {item.mediaType === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                        <svg
                          className="h-12 w-12 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Added</dt>
                <dd className="text-gray-900 font-medium mt-1">
                  {new Date(concert.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </dd>
              </div>
              {concert.confidenceScore !== null && (
                <div>
                  <dt className="text-gray-500">Confidence Score</dt>
                  <dd className="text-gray-900 font-medium mt-1">
                    {(concert.confidenceScore * 100).toFixed(0)}%
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Concert"
        description="Are you sure you want to delete this concert? This action cannot be undone."
      >
        <div className="py-4">
          <p className="text-sm text-gray-600">
            This will permanently delete the concert and all associated data.
          </p>
        </div>
        <ModalFooter>
          <Button
            onClick={() => setShowDeleteModal(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="danger"
            loading={deleteConcert.isPending}
          >
            Delete Concert
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
