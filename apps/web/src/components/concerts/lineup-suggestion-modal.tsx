'use client';

import { useState, useMemo, useEffect } from 'react';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { LineupArtist, EventDay } from '@/lib/api/hooks/use-lineup-suggestions';

interface LineupSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestedArtists: LineupArtist[];
  existingArtistMbids: (string | null)[]; // MBIDs of artists already on the concert
  onConfirm: (selectedArtists: LineupArtist[]) => Promise<void>;
  isLoading: boolean;
  eventDays?: EventDay[]; // Days with events (for multi-day filtering)
  isMultiDay?: boolean;
  queriedDate?: string; // The date user originally selected (dd-MM-yyyy)
}

const INITIAL_DISPLAY_COUNT = 6;

/**
 * Post-save modal that shows suggested artists from the event lineup.
 * Pre-selects headliners, allows user to customize selection.
 * For multi-day events, shows day filter toggles.
 */
export function LineupSuggestionModal({
  isOpen,
  onClose,
  suggestedArtists,
  existingArtistMbids,
  onConfirm,
  isLoading,
  eventDays = [],
  isMultiDay = false,
  queriedDate,
}: LineupSuggestionModalProps) {
  const [showAll, setShowAll] = useState(false);

  // For multi-day events: track which days are selected
  // Default to the queried date, or all days if not specified
  const [selectedDays, setSelectedDays] = useState<Set<string>>(() => {
    if (queriedDate && eventDays.some((d) => d.date === queriedDate)) {
      return new Set([queriedDate]);
    }
    return new Set(eventDays.map((d) => d.date));
  });

  // Reset selected days when eventDays change
  useEffect(() => {
    if (queriedDate && eventDays.some((d) => d.date === queriedDate)) {
      setSelectedDays(new Set([queriedDate]));
    } else {
      setSelectedDays(new Set(eventDays.map((d) => d.date)));
    }
  }, [eventDays, queriedDate]);

  // Filter out artists already on the concert
  const availableArtists = useMemo(() => {
    const existingSet = new Set(existingArtistMbids.filter(Boolean));
    let artists = suggestedArtists.filter((a) => !existingSet.has(a.mbid));

    // For multi-day events, filter by selected days
    if (isMultiDay && selectedDays.size > 0) {
      artists = artists.filter((a) =>
        a.performanceDates?.some((date) => selectedDays.has(date))
      );
    }

    return artists;
  }, [suggestedArtists, existingArtistMbids, isMultiDay, selectedDays]);

  // Pre-select headliners by default
  const [selectedMbids, setSelectedMbids] = useState<Set<string>>(() => {
    return new Set(availableArtists.filter((a) => a.isHeadliner).map((a) => a.mbid));
  });

  // Reset selection when available artists change
  useEffect(() => {
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

  const handleDayToggle = (date: string) => {
    const newSet = new Set(selectedDays);
    if (newSet.has(date)) {
      // Don't allow deselecting all days
      if (newSet.size > 1) {
        newSet.delete(date);
      }
    } else {
      newSet.add(date);
    }
    setSelectedDays(newSet);
  };

  const handleConfirm = async () => {
    const selected = availableArtists.filter((a) => selectedMbids.has(a.mbid));
    await onConfirm(selected);
  };

  // Don't show modal if no artists to suggest
  if (availableArtists.length === 0 && !isMultiDay) {
    return null;
  }

  // For multi-day with no artists after filtering, show a message
  const showNoArtistsMessage = isMultiDay && availableArtists.length === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Other Artists at This Event"
      description={
        isMultiDay
          ? `We found a multi-day event with ${suggestedArtists.length} artist${suggestedArtists.length !== 1 ? 's' : ''}. Select the days you attended.`
          : `We found ${availableArtists.length} other artist${availableArtists.length !== 1 ? 's' : ''} who performed. Did you see any of these?`
      }
      size="lg"
    >
      <div className="space-y-4">
        {/* Day filter toggles - only show for multi-day events */}
        {isMultiDay && eventDays.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {eventDays.map((day) => (
              <button
                key={day.date}
                type="button"
                onClick={() => handleDayToggle(day.date)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  selectedDays.has(day.date)
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-600 hover:border-primary-400'
                }`}
              >
                {day.displayDate}
                <span className="ml-1 text-xs opacity-75">({day.artistCount})</span>
              </button>
            ))}
          </div>
        )}

        {showNoArtistsMessage ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            No additional artists found for the selected day(s).
          </p>
        ) : (
          <>
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
            <div className="space-y-2 max-h-80 overflow-y-auto">
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
          </>
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
