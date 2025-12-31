'use client';

import { useState, useMemo } from 'react';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { LineupArtist } from '@/lib/api/hooks/use-lineup-suggestions';

interface LineupSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestedArtists: LineupArtist[];
  existingArtistMbids: (string | null)[]; // MBIDs of artists already on the concert
  onConfirm: (selectedArtists: LineupArtist[]) => Promise<void>;
  isLoading: boolean;
}

const INITIAL_DISPLAY_COUNT = 6;

/**
 * Post-save modal that shows suggested artists from the event lineup.
 * Pre-selects headliners, allows user to customize selection.
 */
export function LineupSuggestionModal({
  isOpen,
  onClose,
  suggestedArtists,
  existingArtistMbids,
  onConfirm,
  isLoading,
}: LineupSuggestionModalProps) {
  const [showAll, setShowAll] = useState(false);

  // Filter out artists already on the concert
  const availableArtists = useMemo(() => {
    const existingSet = new Set(existingArtistMbids.filter(Boolean));
    return suggestedArtists.filter((a) => !existingSet.has(a.mbid));
  }, [suggestedArtists, existingArtistMbids]);

  // Pre-select headliners by default
  const [selectedMbids, setSelectedMbids] = useState<Set<string>>(() => {
    return new Set(availableArtists.filter((a) => a.isHeadliner).map((a) => a.mbid));
  });

  // Reset selection when modal opens with new artists
  useMemo(() => {
    setSelectedMbids(new Set(availableArtists.filter((a) => a.isHeadliner).map((a) => a.mbid)));
  }, [availableArtists]);

  const displayedArtists = showAll
    ? availableArtists
    : availableArtists.slice(0, INITIAL_DISPLAY_COUNT);

  const remainingCount = availableArtists.length - INITIAL_DISPLAY_COUNT;

  const handleToggle = (mbid: string) => {
    const newSet = new Set(selectedMbids);
    if (newSet.has(mbid)) {
      newSet.delete(mbid);
    } else {
      newSet.add(mbid);
    }
    setSelectedMbids(newSet);
  };

  const handleSelectAll = () => {
    setSelectedMbids(new Set(availableArtists.map((a) => a.mbid)));
  };

  const handleSelectNone = () => {
    setSelectedMbids(new Set());
  };

  const handleConfirm = async () => {
    const selected = availableArtists.filter((a) => selectedMbids.has(a.mbid));
    await onConfirm(selected);
  };

  // Don't show modal if no artists to suggest
  if (availableArtists.length === 0) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Other Artists at This Event"
      description={`We found ${availableArtists.length} other artist${availableArtists.length !== 1 ? 's' : ''} who performed. Did you see any of these?`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Quick select buttons */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Quick select:</span>
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-primary-600 dark:text-primary-400 hover:underline"
          >
            All
          </button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <button
            type="button"
            onClick={handleSelectNone}
            className="text-primary-600 dark:text-primary-400 hover:underline"
          >
            None
          </button>
        </div>

        {/* Artist list */}
        <div className="space-y-2">
          {displayedArtists.map((artist) => (
            <label
              key={artist.mbid}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedMbids.has(artist.mbid)}
                onChange={() => handleToggle(artist.mbid)}
                className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {artist.name}
                  </span>
                  {artist.isHeadliner && (
                    <Badge variant="warning" className="text-xs">
                      Headliner
                    </Badge>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>

        {/* Show more button */}
        {!showAll && remainingCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="w-full py-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Show {remainingCount} more artist{remainingCount !== 1 ? 's' : ''}
          </button>
        )}

        {showAll && availableArtists.length > INITIAL_DISPLAY_COUNT && (
          <button
            type="button"
            onClick={() => setShowAll(false)}
            className="w-full py-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Show less
          </button>
        )}
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Skip
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={selectedMbids.size === 0}
          loading={isLoading}
        >
          Add {selectedMbids.size} Artist{selectedMbids.size !== 1 ? 's' : ''}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
