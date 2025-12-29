'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { MediaWithUrls } from '@encore/shared';
import { AiAnalysisCard } from './ai-analysis-card';

export interface MediaModalProps {
  media: MediaWithUrls | null;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onDelete?: (id: string) => void;
}

/**
 * Media Modal Component
 *
 * Full-screen modal for viewing media in detail.
 * Features:
 * - Full-size image/video display
 * - Keyboard navigation (arrow keys, ESC)
 * - AI analysis display
 * - Metadata information
 * - Delete functionality
 */
export function MediaModal({
  media,
  isOpen,
  onClose,
  onNext,
  onPrevious,
  onDelete,
}: MediaModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [videoError, setVideoError] = useState(false);

  /**
   * Handle keyboard navigation
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && onNext) {
        onNext();
      } else if (e.key === 'ArrowLeft' && onPrevious) {
        onPrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onNext, onPrevious]);

  /**
   * Reset state when media changes
   */
  useEffect(() => {
    setVideoError(false);
  }, [media?.id]);

  /**
   * Handle delete
   */
  const handleDelete = async () => {
    if (!media || !onDelete) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this media? This action cannot be undone.'
    );

    if (confirmed) {
      setIsDeleting(true);
      try {
        await onDelete(media.id);
        onClose();
      } catch (error) {
        console.error('Failed to delete media:', error);
        alert('Failed to delete media. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (!media) return null;

  const isVideo = media.mediaType === 'video';
  const hasAiAnalysis = !!media.aiAnalysis;
  const takenAt = media.takenAt ? new Date(media.takenAt) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      showCloseButton={true}
      closeOnOverlayClick={true}
    >
      <div className="flex flex-col md:flex-row gap-6 -m-6">
        {/* Media display */}
        <div className="flex-1 bg-black flex items-center justify-center relative min-h-[60vh] md:min-h-[80vh]">
          {isVideo ? (
            videoError ? (
              <div className="text-center p-8">
                <svg
                  className="h-16 w-16 text-gray-400 mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-white text-sm">Failed to load video</p>
              </div>
            ) : (
              <video
                src={media.downloadUrl}
                controls
                autoPlay
                className="max-w-full max-h-full"
                onError={() => setVideoError(true)}
              >
                Your browser does not support the video tag.
              </video>
            )
          ) : (
            <img
              src={media.downloadUrl}
              alt={media.originalFilename || 'Media'}
              className="max-w-full max-h-full object-contain"
            />
          )}

          {/* Navigation buttons */}
          {onPrevious && (
            <button
              onClick={onPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all"
              aria-label="Previous"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {onNext && (
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all"
              aria-label="Next"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Metadata sidebar */}
        <div className="w-full md:w-80 p-6 bg-gray-50 overflow-y-auto">
          <div className="space-y-6">
            {/* Title and badges */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {media.originalFilename || 'Untitled'}
              </h3>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="default">
                  {isVideo ? 'Video' : 'Photo'}
                </Badge>
                {hasAiAnalysis && (
                  <Badge variant="info">AI Analyzed</Badge>
                )}
                {media.concertId && (
                  <Badge variant="success">Assigned to Concert</Badge>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Date Taken
                </p>
                <p className="text-sm text-gray-900 mt-1">
                  {takenAt
                    ? takenAt.toLocaleString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : 'Unknown'}
                </p>
              </div>

              {isVideo && media.duration && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Duration
                  </p>
                  <p className="text-sm text-gray-900 mt-1">
                    {formatDuration(media.duration)}
                  </p>
                </div>
              )}

              {(media.locationLat && media.locationLng) && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Location
                  </p>
                  <p className="text-sm text-gray-900 mt-1">
                    {media.locationLat.toFixed(6)}, {media.locationLng.toFixed(6)}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Uploaded
                </p>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(media.createdAt).toLocaleString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* AI Analysis */}
            {hasAiAnalysis && media.aiAnalysis && (
              <AiAnalysisCard analysis={media.aiAnalysis} />
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-gray-200 space-y-3">
              <a
                href={media.downloadUrl}
                download={media.originalFilename || 'download'}
                className="block"
              >
                <Button variant="outline" size="md" fullWidth>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download
                </Button>
              </a>

              {onDelete && (
                <Button
                  variant="danger"
                  size="md"
                  fullWidth
                  onClick={handleDelete}
                  disabled={isDeleting}
                  loading={isDeleting}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Format duration in seconds to HH:MM:SS or MM:SS
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
