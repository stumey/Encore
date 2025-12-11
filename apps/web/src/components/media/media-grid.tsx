'use client';

import { MediaCard } from './media-card';
import type { MediaWithUrls } from '@encore/shared';

export interface MediaGridProps {
  items: MediaWithUrls[];
  selectedIds?: Set<string>;
  onSelect?: (id: string) => void;
  onItemClick: (media: MediaWithUrls) => void;
}

/**
 * Media Grid Component
 *
 * Responsive grid layout for displaying media thumbnails.
 * Supports selection mode for bulk operations.
 */
export function MediaGrid({
  items,
  selectedIds,
  onSelect,
  onItemClick,
}: MediaGridProps) {
  const selectionMode = selectedIds !== undefined && onSelect !== undefined;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {items.map((media) => (
        <MediaCard
          key={media.id}
          media={media}
          selected={selectedIds?.has(media.id)}
          selectionMode={selectionMode}
          onSelect={onSelect}
          onClick={onItemClick}
        />
      ))}
    </div>
  );
}
