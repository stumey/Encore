'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMedia, useDeleteMedia } from '@/lib/api/hooks/use-media';
import { MediaGrid } from '@/components/media/media-grid';
import { MediaModal } from '@/components/media/media-modal';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import type { MediaWithUrls } from '@encore/shared';
import type { MediaType } from '@encore/shared';

/**
 * Media Gallery Page
 *
 * Displays user's uploaded media with filtering, pagination, and bulk operations.
 * Features:
 * - Filter by media type (All, Photos, Videos, Unassigned)
 * - Grid view with thumbnails
 * - Full-screen modal viewer
 * - Bulk selection and delete
 * - Pagination
 */
export default function MediaPage() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'photos' | 'videos' | 'unassigned'>('all');
  const [selectedMedia, setSelectedMedia] = useState<MediaWithUrls | null>(null);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const limit = 24;

  // Build filters for API
  const filters = (() => {
    if (activeFilter === 'photos') return { mediaType: 'photo' as MediaType };
    if (activeFilter === 'videos') return { mediaType: 'video' as MediaType };
    if (activeFilter === 'unassigned') return { concertId: '' };
    return undefined;
  })();

  const { data, isLoading, error } = useMedia(page, limit, filters);
  const deleteMediaMutation = useDeleteMedia();

  const handleBulkSelect = (id: string) => {
    const newSelected = new Set(bulkSelectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setBulkSelectedIds(newSelected);
  };

  const handleBulkSelectAll = () => {
    if (!data?.data) return;

    if (bulkSelectedIds.size === data.data.length) {
      setBulkSelectedIds(new Set());
    } else {
      setBulkSelectedIds(new Set(data.data.map(m => m.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${bulkSelectedIds.size} items?`)) return;

    try {
      await Promise.all(
        Array.from(bulkSelectedIds).map(id =>
          deleteMediaMutation.mutateAsync(id)
        )
      );
      setBulkSelectedIds(new Set());
    } catch (err) {
      console.error('Failed to delete media:', err);
    }
  };

  const handleMediaClick = (media: MediaWithUrls) => {
    setSelectedMedia(media);
  };

  const handleCloseModal = () => {
    setSelectedMedia(null);
  };

  const mediaItems = data?.data || [];
  const totalPages = data ? Math.ceil(data.pagination.total / limit) : 0;
  const hasSelection = bulkSelectedIds.size > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Media</h1>
            <p className="text-gray-500 mt-1">
              {data ? `${data.pagination.total} items` : 'Loading...'}
            </p>
          </div>
          <Link href="/media/upload">
            <Button variant="primary" size="lg">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload Media
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center justify-between">
          <Tabs defaultValue="all" onValueChange={(val) => setActiveFilter(val as typeof activeFilter)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="videos">Videos</TabsTrigger>
              <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
            </TabsList>
          </Tabs>

          {hasSelection && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {bulkSelectedIds.size} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkSelectAll}
              >
                {bulkSelectedIds.size === mediaItems.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleBulkDelete}
                loading={deleteMediaMutation.isPending}
              >
                Delete Selected
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700">Failed to load media</p>
            <p className="text-sm text-red-600 mt-1">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        ) : mediaItems.length === 0 ? (
          <EmptyState
            icon={
              <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            }
            title="No media found"
            description={
              activeFilter === 'all'
                ? "Upload your first photo or video to get started"
                : `No ${activeFilter} to display`
            }
            action={{
              label: "Upload Media",
              onClick: () => window.location.href = '/media/upload'
            }}
          />
        ) : (
          <>
            <MediaGrid
              items={mediaItems}
              selectedIds={bulkSelectedIds}
              onSelect={handleBulkSelect}
              onItemClick={handleMediaClick}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600 px-4">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Full-screen viewer modal */}
      {selectedMedia && (
        <MediaModal
          media={selectedMedia}
          isOpen={true}
          onClose={handleCloseModal}
          onNext={() => {
            const currentIndex = mediaItems.findIndex(m => m.id === selectedMedia.id);
            if (currentIndex < mediaItems.length - 1) {
              setSelectedMedia(mediaItems[currentIndex + 1]);
            }
          }}
          onPrevious={() => {
            const currentIndex = mediaItems.findIndex(m => m.id === selectedMedia.id);
            if (currentIndex > 0) {
              setSelectedMedia(mediaItems[currentIndex - 1]);
            }
          }}
          onDelete={async (id) => {
            await deleteMediaMutation.mutateAsync(id);
          }}
        />
      )}
    </div>
  );
}
