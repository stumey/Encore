'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateConcert } from '@/lib/api/hooks/use-concerts';
import { useArtists, useCreateArtistFromGenius, GeniusArtistResult } from '@/lib/api/hooks/use-artists';
import { useVenues, useCreateVenueFromSetlist, SetlistFmVenueResult } from '@/lib/api/hooks/use-venues';
import { useLineupSuggestions, useAddSuggestedArtists } from '@/lib/api/hooks/use-lineup-suggestions';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/text-input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Modal } from '@/components/ui/modal';
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
  const createArtistFromGenius = useCreateArtistFromGenius();

  // Form state
  const [concertDate, setConcertDate] = useState('');
  const [selectedArtists, setSelectedArtists] = useState<SelectedArtist[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [tourName, setTourName] = useState('');
  const [notes, setNotes] = useState('');

  // Search state
  const [artistSearchQuery, setArtistSearchQuery] = useState('');
  const [venueSearchQuery, setVenueSearchQuery] = useState('');
  const [showArtistSearch, setShowArtistSearch] = useState(false);
  const [showVenueSearch, setShowVenueSearch] = useState(false);

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
    setShowArtistSearch(false);
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
      setShowVenueSearch(false);
      return;
    }

    // Venue is from Setlist.fm - need to create/find in local DB first
    if ('setlistFmId' in venue && venue.setlistFmId) {
      try {
        const savedVenue = await createVenueFromSetlist.mutateAsync(venue as SetlistFmVenueResult);
        setSelectedVenue(savedVenue);
        setVenueSearchQuery('');
        setShowVenueSearch(false);
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

  const isFormValid = concertDate && selectedArtists.length > 0;

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
              <TextInput
                type="date"
                value={concertDate}
                onChange={(e) => setConcertDate(e.target.value)}
                required
                fullWidth
                label="Date"
              />
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

                {/* Add Artist Button */}
                <Button
                  type="button"
                  onClick={() => setShowArtistSearch(true)}
                  variant="outline"
                  fullWidth
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Artist
                </Button>

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
                      onClick={() => setSelectedVenue(null)}
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
                <Button
                  type="button"
                  onClick={() => setShowVenueSearch(true)}
                  variant="outline"
                  fullWidth
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Select Venue
                </Button>
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

      {/* Artist Search Modal */}
      <Modal
        isOpen={showArtistSearch}
        onClose={() => {
          setShowArtistSearch(false);
          setArtistSearchQuery('');
        }}
        title="Search Artists"
        size="lg"
      >
        <div className="space-y-4">
          <TextInput
            type="search"
            placeholder="Search for an artist..."
            value={artistSearchQuery}
            onChange={(e) => setArtistSearchQuery(e.target.value)}
            fullWidth
            autoFocus
          />

          {artistsLoading && (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          )}

          {!artistsLoading && artistSearchQuery && availableArtists.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No artists found. Try a different search term.
            </p>
          )}

          {!artistsLoading && availableArtists.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {artistSearchResults?.source === 'genius' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Results from Genius
                </p>
              )}
              {availableArtists.map((artist, index) => (
                <button
                  key={artist.id || `genius-${index}`}
                  type="button"
                  onClick={() => handleAddArtist(artist)}
                  disabled={createArtistFromGenius.isPending}
                  className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-colors text-left disabled:opacity-50"
                >
                  {artist.imageUrl && (
                    <img
                      src={artist.imageUrl}
                      alt={artist.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">{artist.name}</h4>
                    {artist.genres && artist.genres.length > 0 && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {artist.genres.slice(0, 3).join(', ')}
                      </p>
                    )}
                  </div>
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              ))}
            </div>
          )}

          {!artistSearchQuery && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Start typing to search for artists
            </p>
          )}
        </div>
      </Modal>

      {/* Venue Search Modal */}
      <Modal
        isOpen={showVenueSearch}
        onClose={() => {
          setShowVenueSearch(false);
          setVenueSearchQuery('');
        }}
        title="Search Venues"
        size="lg"
      >
        <div className="space-y-4">
          <TextInput
            type="search"
            placeholder="Search for a venue..."
            value={venueSearchQuery}
            onChange={(e) => setVenueSearchQuery(e.target.value)}
            fullWidth
            autoFocus
          />

          {venuesLoading && (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          )}

          {!venuesLoading && venueSearchQuery && (!venueSearchResults?.data || venueSearchResults.data.length === 0) && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No venues found. Try a different search term.
            </p>
          )}

          {!venuesLoading && venueSearchResults?.data && venueSearchResults.data.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {venueSearchResults.source === 'setlistfm' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Results from Setlist.fm
                </p>
              )}
              {venueSearchResults.data.map((venue, index) => (
                <button
                  key={venue.id || `setlist-${index}`}
                  type="button"
                  onClick={() => handleSelectVenue(venue)}
                  disabled={createVenueFromSetlist.isPending}
                  className="w-full flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-colors text-left disabled:opacity-50"
                >
                  <div className="flex-shrink-0 h-10 w-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">{venue.name}</h4>
                    {(venue.city || venue.state || venue.country) && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {[venue.city, venue.state, venue.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  <svg className="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}

          {!venueSearchQuery && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Start typing to search for venues
            </p>
          )}
        </div>
      </Modal>

      {/* Lineup Suggestion Modal - shown after concert is created */}
      <LineupSuggestionModal
        isOpen={showLineupModal}
        onClose={handleLineupSkip}
        suggestedArtists={lineupData?.artists || []}
        existingArtistMbids={selectedArtists.map(a => a.artist.mbid)}
        onConfirm={handleLineupConfirm}
        isLoading={addSuggestedArtists.isPending}
      />
    </div>
  );
}
