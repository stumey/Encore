'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateConcert } from '@/lib/api/hooks/use-concerts';
import { useArtists, useCreateArtistFromGenius, useCreateArtist, GeniusArtistResult } from '@/lib/api/hooks/use-artists';
import { useVenues, useCreateVenueFromSetlist, useCreateVenue, SetlistFmVenueResult } from '@/lib/api/hooks/use-venues';
import { useLineupSuggestions, useAddSuggestedArtists } from '@/lib/api/hooks/use-lineup-suggestions';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/text-input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { LineupIndicator } from '@/components/concerts/lineup-indicator';
import { LineupSuggestionModal } from '@/components/concerts/lineup-suggestion-modal';
import type { Artist, Venue } from '@encore/shared';

interface SelectedArtist {
  artistId: string;
  artist: Artist;
  isHeadliner: boolean;
  setOrder: number;
}

/**
 * Create Concert Form Page
 *
 * Form for adding a new concert with:
 * - Date picker
 * - Artist search and selection (multiple artists, mark headliner)
 * - Venue search/select
 * - Tour name (optional)
 * - Notes (optional)
 */
export default function NewConcertPage() {
  const router = useRouter();
  const createConcert = useCreateConcert();
  const createVenueFromSetlist = useCreateVenueFromSetlist();
  const createVenue = useCreateVenue();
  const createArtistFromGenius = useCreateArtistFromGenius();
  const createArtist = useCreateArtist();

  // Form state
  const [concertDate, setConcertDate] = useState('');
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [concertEndDate, setConcertEndDate] = useState('');
  const [selectedArtists, setSelectedArtists] = useState<SelectedArtist[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [tourName, setTourName] = useState('');
  const [notes, setNotes] = useState('');

  // Search state
  const [artistSearchQuery, setArtistSearchQuery] = useState('');
  const [venueSearchQuery, setVenueSearchQuery] = useState('');

  // Lineup suggestion state
  const [showLineupModal, setShowLineupModal] = useState(false);
  const [createdConcertId, setCreatedConcertId] = useState<string | null>(null);

  // API queries
  const { data: artistSearchResults, isLoading: artistsLoading } = useArtists(artistSearchQuery);
  const { data: venueSearchResults, isLoading: venuesLoading } = useVenues(venueSearchQuery);

  // Lineup suggestions - fetch when venue and date are both set
  const {
    data: lineupData,
    isLoading: lineupLoading,
    isError: lineupError,
  } = useLineupSuggestions(selectedVenue?.setlistFmId || null, concertDate || null);

  const addSuggestedArtists = useAddSuggestedArtists();

  // Filter out already selected artists
  const availableArtists = useMemo(() => {
    if (!artistSearchResults?.data) return [];
    const selectedIds = new Set(selectedArtists.map(a => a.artistId));
    // Filter by id for cached artists, or by geniusId for Genius results
    return artistSearchResults.data.filter(artist => {
      if (artist.id) {
        return !selectedIds.has(artist.id);
      }
      return true; // Genius results don't have local IDs yet
    });
  }, [artistSearchResults, selectedArtists]);

  const handleAddArtist = async (artist: Artist | GeniusArtistResult) => {
    let savedArtist: Artist;

    // If artist has an id, it's from local cache - use directly
    if (artist.id) {
      savedArtist = artist as Artist;
    } else if ('geniusId' in artist && artist.geniusId) {
      // Artist is from Genius - need to create/find in local DB first
      try {
        savedArtist = await createArtistFromGenius.mutateAsync(artist as GeniusArtistResult);
      } catch (error) {
        console.error('Failed to save artist:', error);
        return;
      }
    } else {
      return;
    }

    const newArtist: SelectedArtist = {
      artistId: savedArtist.id,
      artist: savedArtist,
      isHeadliner: selectedArtists.length === 0, // First artist is headliner by default
      setOrder: selectedArtists.length + 1,
    };
    setSelectedArtists([...selectedArtists, newArtist]);
    setArtistSearchQuery('');
  };

  const handleRemoveArtist = (artistId: string) => {
    setSelectedArtists(selectedArtists.filter(a => a.artistId !== artistId));
  };

  const handleToggleHeadliner = (artistId: string) => {
    setSelectedArtists(
      selectedArtists.map(a => ({
        ...a,
        isHeadliner: a.artistId === artistId,
      }))
    );
  };

  const handleSelectVenue = async (venue: Venue | SetlistFmVenueResult) => {
    // If venue has an id, it's from local cache - use directly
    if (venue.id) {
      setSelectedVenue(venue as Venue);
      setVenueSearchQuery('');
      return;
    }

    // Venue is from Setlist.fm - need to create/find in local DB first
    if ('setlistFmId' in venue && venue.setlistFmId) {
      try {
        const savedVenue = await createVenueFromSetlist.mutateAsync(venue as SetlistFmVenueResult);
        setSelectedVenue(savedVenue);
        setVenueSearchQuery('');
      } catch (error) {
        console.error('Failed to save venue:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!concertDate || selectedArtists.length === 0) {
      return;
    }

    try {
      const concert = await createConcert.mutateAsync({
        concertDate: new Date(concertDate),
        concertEndDate: isMultiDay && concertEndDate ? new Date(concertEndDate) : undefined,
        venueId: selectedVenue?.id,
        tourName: tourName || undefined,
        notes: notes || undefined,
        artists: selectedArtists.map(a => ({
          artistId: a.artistId,
          isHeadliner: a.isHeadliner,
          setOrder: a.setOrder,
        })),
      });

      // Check if we have lineup suggestions to show
      const suggestedArtists = lineupData?.artists || [];
      const existingMbids = selectedArtists.map(a => a.artist.mbid);
      const newSuggestions = suggestedArtists.filter(a => !existingMbids.includes(a.mbid));

      if (newSuggestions.length > 0) {
        // Show lineup modal before navigating
        setCreatedConcertId(concert.id);
        setShowLineupModal(true);
      } else {
        // No suggestions, navigate directly
        router.push(`/concerts/${concert.id}`);
      }
    } catch (error) {
      console.error('Failed to create concert:', error);
    }
  };

  const handleLineupConfirm = async (selectedLineupArtists: { mbid: string; name: string; isHeadliner: boolean }[]) => {
    if (!createdConcertId || selectedLineupArtists.length === 0) {
      setShowLineupModal(false);
      router.push(`/concerts/${createdConcertId}`);
      return;
    }

    try {
      await addSuggestedArtists.mutateAsync({
        concertId: createdConcertId,
        artists: selectedLineupArtists,
      });
    } catch (error) {
      console.error('Failed to add suggested artists:', error);
    }

    setShowLineupModal(false);
    router.push(`/concerts/${createdConcertId}`);
  };

  const handleLineupSkip = () => {
    setShowLineupModal(false);
    if (createdConcertId) {
      router.push(`/concerts/${createdConcertId}`);
    }
  };

  const isFormValid =
    concertDate &&
    selectedArtists.length > 0 &&
    (!isMultiDay || (concertEndDate && concertEndDate >= concertDate));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            onClick={() => router.push('/concerts')}
            variant="ghost"
            size="sm"
            className="mb-4"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Concerts
          </Button>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add Concert</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Add a new concert to your collection
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date */}
          <Card>
            <CardHeader>
              <CardTitle>Concert Date</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <TextInput
                  type="date"
                  value={concertDate}
                  onChange={(e) => setConcertDate(e.target.value)}
                  required
                  fullWidth
                  label={isMultiDay ? 'Start Date' : 'Date'}
                />

                {/* Multi-day toggle */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMultiDay}
                    onChange={(e) => {
                      setIsMultiDay(e.target.checked);
                      if (!e.target.checked) {
                        setConcertEndDate('');
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Multi-day event (festival, residency, etc.)
                  </span>
                </label>

                {/* End date picker - shown when multi-day is checked */}
                {isMultiDay && (
                  <TextInput
                    type="date"
                    value={concertEndDate}
                    onChange={(e) => setConcertEndDate(e.target.value)}
                    min={concertDate}
                    required={isMultiDay}
                    fullWidth
                    label="End Date"
                    error={
                      concertEndDate && concertDate && concertEndDate < concertDate
                        ? 'End date must be on or after start date'
                        : undefined
                    }
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Artists */}
          <Card>
            <CardHeader>
              <CardTitle>Artists</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Selected Artists */}
                {selectedArtists.length > 0 && (
                  <div className="space-y-2">
                    {selectedArtists.map((artistData) => (
                      <div
                        key={artistData.artistId}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {artistData.artist.imageUrl && (
                            <img
                              src={artistData.artist.imageUrl}
                              alt={artistData.artist.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {artistData.artist.name}
                              </span>
                              {artistData.isHeadliner && (
                                <Badge variant="warning">Headliner</Badge>
                              )}
                            </div>
                            {artistData.artist.genres && artistData.artist.genres.length > 0 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {artistData.artist.genres.slice(0, 3).join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!artistData.isHeadliner && (
                            <Button
                              type="button"
                              onClick={() => handleToggleHeadliner(artistData.artistId)}
                              variant="outline"
                              size="sm"
                            >
                              Mark as Headliner
                            </Button>
                          )}
                          <Button
                            type="button"
                            onClick={() => handleRemoveArtist(artistData.artistId)}
                            variant="ghost"
                            size="sm"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Artist - Inline Autocomplete */}
                <div className="relative">
                  <TextInput
                    type="text"
                    placeholder="Search or type artist name..."
                    value={artistSearchQuery}
                    onChange={(e) => setArtistSearchQuery(e.target.value)}
                    fullWidth
                  />
                  {/* Dropdown */}
                  {artistSearchQuery.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {artistsLoading && (
                        <div className="flex justify-center py-4">
                          <Spinner size="sm" />
                        </div>
                      )}

                      {!artistsLoading && availableArtists.length > 0 && (
                        <>
                          {artistSearchResults?.source === 'genius' && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2 border-b border-gray-100 dark:border-slate-700">
                              From Genius
                            </p>
                          )}
                          {availableArtists.map((artist, index) => (
                            <button
                              key={artist.id || `genius-${index}`}
                              type="button"
                              onClick={() => handleAddArtist(artist)}
                              disabled={createArtistFromGenius.isPending}
                              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left disabled:opacity-50"
                            >
                              {artist.imageUrl ? (
                                <img
                                  src={artist.imageUrl}
                                  alt={artist.name}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-primary-600 dark:text-primary-400">🎤</span>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate">{artist.name}</p>
                                {artist.genres && artist.genres.length > 0 && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    {artist.genres.slice(0, 3).join(', ')}
                                  </p>
                                )}
                              </div>
                            </button>
                          ))}
                        </>
                      )}

                      {/* Only show "Use [query]" when no results and not loading */}
                      {!artistsLoading && availableArtists.length === 0 && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const newArtist = await createArtist.mutateAsync({ name: artistSearchQuery });
                              setSelectedArtists([...selectedArtists, {
                                artistId: newArtist.id,
                                artist: newArtist,
                                isHeadliner: selectedArtists.length === 0,
                                setOrder: selectedArtists.length + 1,
                              }]);
                              setArtistSearchQuery('');
                            } catch (error) {
                              console.error('Failed to create artist:', error);
                            }
                          }}
                          disabled={createArtist.isPending}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left disabled:opacity-50"
                        >
                          <span className="text-green-600 dark:text-green-400">+</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            Use "<span className="font-medium">{artistSearchQuery}</span>"
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {selectedArtists.length === 0 && (
                  <p className="text-sm text-red-600 dark:text-red-400">At least one artist is required</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Venue */}
          <Card>
            <CardHeader>
              <CardTitle>Venue (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedVenue ? (
                <>
                  <div className="flex items-start justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{selectedVenue.name}</h4>
                      {(selectedVenue.city || selectedVenue.state) && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {[selectedVenue.city, selectedVenue.state, selectedVenue.country]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        setSelectedVenue(null);
                        setVenueSearchQuery('');
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
                  {/* Lineup indicator - shown when venue and date are set */}
                  {concertDate && (
                    <LineupIndicator
                      artistCount={lineupData?.artists?.length || null}
                      isLoading={lineupLoading}
                      isError={lineupError}
                    />
                  )}
                </>
              ) : (
                <div className="relative">
                  <TextInput
                    type="text"
                    placeholder="Search or type venue name..."
                    value={venueSearchQuery}
                    onChange={(e) => setVenueSearchQuery(e.target.value)}
                    fullWidth
                  />
                  {/* Dropdown */}
                  {venueSearchQuery.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {venuesLoading && (
                        <div className="flex justify-center py-4">
                          <Spinner size="sm" />
                        </div>
                      )}

                      {!venuesLoading && venueSearchResults?.data && venueSearchResults.data.length > 0 && (
                        <>
                          {venueSearchResults.source === 'setlistfm' && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2 border-b border-gray-100 dark:border-slate-700">
                              From Setlist.fm
                            </p>
                          )}
                          {venueSearchResults.data.map((venue, index) => (
                            <button
                              key={venue.id || `setlist-${index}`}
                              type="button"
                              onClick={() => handleSelectVenue(venue)}
                              disabled={createVenueFromSetlist.isPending}
                              className="w-full flex items-start gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left disabled:opacity-50"
                            >
                              <span className="text-primary-600 dark:text-primary-400 mt-0.5">📍</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate">{venue.name}</p>
                                {(venue.city || venue.state || venue.country) && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    {[venue.city, venue.state, venue.country].filter(Boolean).join(', ')}
                                  </p>
                                )}
                              </div>
                            </button>
                          ))}
                        </>
                      )}

                      {/* Only show "Use [query]" when no results and not loading */}
                      {!venuesLoading && (!venueSearchResults?.data || venueSearchResults.data.length === 0) && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const newVenue = await createVenue.mutateAsync({ name: venueSearchQuery });
                              setSelectedVenue(newVenue);
                              setVenueSearchQuery('');
                            } catch (error) {
                              console.error('Failed to create venue:', error);
                            }
                          }}
                          disabled={createVenue.isPending}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left disabled:opacity-50"
                        >
                          <span className="text-green-600 dark:text-green-400">+</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            Use "<span className="font-medium">{venueSearchQuery}</span>"
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tour Name */}
          <Card>
            <CardHeader>
              <CardTitle>Tour Name (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <TextInput
                value={tourName}
                onChange={(e) => setTourName(e.target.value)}
                placeholder="e.g., World Tour 2024"
                fullWidth
              />
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this concert..."
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 transition-colors duration-200"
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              onClick={() => router.push('/concerts')}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!isFormValid}
              loading={createConcert.isPending}
            >
              Create Concert
            </Button>
          </div>
        </form>
      </div>

      {/* Lineup Suggestion Modal - shown after concert is created */}
      <LineupSuggestionModal
        isOpen={showLineupModal}
        onClose={handleLineupSkip}
        suggestedArtists={lineupData?.artists || []}
        existingArtistMbids={selectedArtists.map(a => a.artist.mbid)}
        onConfirm={handleLineupConfirm}
        isLoading={addSuggestedArtists.isPending}
        eventDays={lineupData?.eventDays}
        isMultiDay={isMultiDay && lineupData?.isMultiDay}
        queriedDate={lineupData?.queriedDate}
      />
    </div>
  );
}
