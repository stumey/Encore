'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import type { MediaWithUrls } from '@encore/shared';

export interface MediaCardProps {
  media: MediaWithUrls;
  selected?: boolean;
  selectionMode?: boolean;
  onSelect?: (id: string) => void;
  onClick: (media: MediaWithUrls) => void;
}

/**
 * Media Card Component
 *
 * Individual media item card with thumbnail, metadata, and selection support.
 * Shows video duration, AI analysis status, and concert assignment.
 */
export function MediaCard({
  media,
  selected = false,
  selectionMode = false,
  onSelect,
  onClick,
}: MediaCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleCardClick = () => {
    if (selectionMode && onSelect) {
      onSelect(media.id);
    } else {
      onClick(media);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(media.id);
    }
  };

  const thumbnailUrl = media.thumbnailUrl || media.downloadUrl;
  const isVideo = media.mediaType === 'video';
  const hasAiAnalysis = !!media.aiAnalysis;
  const takenAt = media.takenAt ? new Date(media.takenAt) : null;

  return (
    <div
      className={`
        relative group cursor-pointer rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800
        transition-all duration-200 hover:shadow-lg
        ${selected ? 'ring-4 ring-primary-500' : 'ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-gray-300 dark:hover:ring-gray-600'}
      `}
      onClick={handleCardClick}
    >
      {/* Aspect ratio container */}
      <div className="aspect-square relative">
        {/* Thumbnail */}
        {!imageError && thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={media.originalFilename || 'Media'}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
            <svg
              className="h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Video overlay */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all">
            <div className="bg-white bg-opacity-90 rounded-full p-3">
              <svg
                className="h-6 w-6 text-gray-900"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Video duration */}
        {isVideo && media.duration && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {formatDuration(media.duration)}
          </div>
        )}

        {/* Selection checkbox */}
        {selectionMode && (
          <div
            className="absolute top-2 left-2 z-10"
            onClick={handleCheckboxClick}
          >
            <div
              className={`
                w-6 h-6 rounded border-2 flex items-center justify-center
                transition-all cursor-pointer
                ${selected
                  ? 'bg-primary-600 border-primary-600'
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 hover:border-primary-400'
                }
              `}
            >
              {selected && (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {hasAiAnalysis && (
            <Badge variant="info" className="text-xs">
              AI
            </Badge>
          )}
        </div>
      </div>

      {/* Metadata footer */}
      <div className="p-2 bg-white dark:bg-gray-800">
        <p className="text-xs text-gray-900 dark:text-white font-medium truncate">
          {media.originalFilename || 'Untitled'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {takenAt ? formatDate(takenAt) : 'Date unknown'}
        </p>
        {media.concertId && (
          <Badge variant="success" className="text-xs mt-1">
            Assigned
          </Badge>
        )}
      </div>
    </div>
  );
}

/**
 * Format duration in seconds to MM:SS
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format date to locale string
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
