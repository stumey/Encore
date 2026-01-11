'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useConcert, useUpdateConcert } from '@/lib/api/hooks/use-concerts';
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
import type { Artist, Venue, EventType } from '@encore/shared';

interface SelectedArtist {
  artistId: string;
  artist: Artist;
  isHeadliner: boolean;
  setOrder: number;
}

/**
 * Edit Concert Form Page
 *
 * Form for editing an existing concert with pre-populated data:
 * - Date picker
 * - Artist search and selection (multiple artists, mark headliner)
 * - Venue search/select
 * - Tour name (optional)
 * - Notes (optional)
 */
export default function EditConcertPage() {
  const router = useRouter();
  const params = useParams();
  const concertId = params.id as string;

  // Fetch existing concert data
  const { data: concert, isLoading: concertLoading, error: concertError } = useConcert(concertId);

  const updateConcert = useUpdateConcert();
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
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState<EventType>('concert');
  const [notes, setNotes] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [festivalNameError, setFestivalNameError] = useState(false);

  // Search state
  const [artistSearchQuery, setArtistSearchQuery] = useState('');
  const [venueSearchQuery, setVenueSearchQuery] = useState('');

  // Lineup suggestion state
  const [showLineupModal, setShowLineupModal] = useState(false);

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

  // Pre-populate form when concert data loads
  useEffect(() => {
    if (concert && !isInitialized) {
      // Set date (format as YYYY-MM-DD for input[type="date"])
      const date = new Date(concert.concertDate);
      setConcertDate(date.toISOString().split('T')[0]);

      // Set end date if multi-day event
      if (concert.concertEndDate) {
        setIsMultiDay(true);
        const endDate = new Date(concert.concertEndDate);
        setConcertEndDate(endDate.toISOString().split('T')[0]);
      }

      // Set artists
      if (concert.artists && concert.artists.length > 0) {
        const artists: SelectedArtist[] = concert.artists.map((ca, index) => ({
          artistId: ca.artist.id,
          artist: ca.artist,
          isHeadliner: ca.isHeadliner,
          setOrder: ca.setOrder ?? index + 1,
        }));
        setSelectedArtists(artists);
      }

      // Set venue
      if (concert.venue) {
        setSelectedVenue(concert.venue);
      }

      // Set tour name
      if (concert.tourName) {
        setTourName(concert.tourName);
      }

      // Set event name and type
      if (concert.eventName) {
        setEventName(concert.eventName);
      }
      if (concert.eventType) {
        setEventType(concert.eventType);
      }

      // Set notes
      if (concert.notes) {
        setNotes(concert.notes);
      }

      setIsInitialized(true);
    }
  }, [concert, isInitialized]);

  // Filter out already selected artists
  const availableArtists = useMemo(() => {
    if (!artistSearchResults?.data) return [];
    const selectedIds = new Set(selectedArtists.map(a => a.artistId));
    return artistSearchResults.data.filter(artist => {
      if (artist.id) {
        return !selectedIds.has(artist.id);
      }
      return true;
    });
  }, [artistSearchResults, selectedArtists]);

  const handleAddArtist = async (artist: Artist | GeniusArtistResult) => {
    let savedArtist: Artist;

    if (artist.id) {
      savedArtist = artist as Artist;
    } else if ('geniusId' in artist && artist.geniusId) {
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
      isHeadliner: selectedArtists.length === 0,
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
    if (venue.id) {
      setSelectedVenue(venue as Venue);
      setVenueSearchQuery('');
      return;
    }

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

    // Require festival name when eventType is 'festival'
    if (eventType === 'festival' && !eventName.trim()) {
      setFestivalNameError(true);
      return;
    }
    setFestivalNameError(false);

    try {
      await updateConcert.mutateAsync({
        id: concertId,
        data: {
          concertDate: new Date(concertDate),
          concertEndDate: isMultiDay && concertEndDate ? new Date(concertEndDate) : undefined,
          venueId: selectedVenue?.id,
          tourName: tourName || undefined,
          eventName: eventName || undefined,
          eventType: eventType,
          notes: notes || undefined,
          artists: selectedArtists.map(a => ({
            artistId: a.artistId,
            isHeadliner: a.isHeadliner,
            setOrder: a.setOrder,
          })),
        },
      });

      // Check if we have lineup suggestions to show
      if (lineupData?.artists && lineupData.artists.length > 0) {
        // Filter out artists already on the concert
        const existingMbids = new Set(
          selectedArtists.map((a) => a.artist.mbid).filter(Boolean)
        );
        const availableSuggestions = lineupData.artists.filter(
          (a) => !existingMbids.has(a.mbid)
        );
        if (availableSuggestions.length > 0) {
          setShowLineupModal(true);
          return;
        }
      }

      router.push(`/concerts/${concertId}`);
    } catch (error) {
      console.error('Failed to update concert:', error);
    }
  };

  const handleLineupConfirm = async (
    artists: Array<{ mbid: string; name: string; isHeadliner: boolean }>
  ) => {
    await addSuggestedArtists.mutateAsync({ concertId, artists });
    setShowLineupModal(false);
    router.push(`/concerts/${concertId}`);
  };

  const handleLineupSkip = () => {
    setShowLineupModal(false);
    router.push(`/concerts/${concertId}`);
  };

  const isFormValid =
    concertDate &&
    selectedArtists.length > 0 &&
    (!isMultiDay || (concertEndDate && concertEndDate >= concertDate));

  // Loading state
  if (concertLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading concert...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (concertError || !concert) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
              Concert Not Found
            </h2>
            <p className="text-red-600 dark:text-red-400 mb-4">
              The concert you&apos;re trying to edit doesn&apos;t exist or you don&apos;t have permission to edit it.
            </p>
            <Button onClick={() => router.push('/concerts')} variant="outline">
              Back to Concerts
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            onClick={() => router.push(`/concerts/${concertId}`)}
            variant="ghost"
            size="sm"
            className="mb-4"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Concert
          </Button>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Concert</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Update the details of this concert
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
                      onClick={() => setSelectedVenue(null)}
                      variant="ghost"
                      size="sm"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
                  {/* Lineup indicator - shows when venue + date are set */}
                  {concertDate && (
                    <LineupIndicator
                      artistCount={lineupData?.artists?.length ?? null}
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

          {/* Event Name & Type */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Event Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Event Type
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="eventType"
                        value="concert"
                        checked={eventType === 'concert'}
                        onChange={(e) => {
                          setEventType(e.target.value as EventType);
                          setFestivalNameError(false);
                        }}
                        className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Concert</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="eventType"
                        value="festival"
                        checked={eventType === 'festival'}
                        onChange={(e) => setEventType(e.target.value as EventType)}
                        className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Festival</span>
                    </label>
                  </div>
                </div>

                {/* Event Name - shown more prominently for festivals */}
                <TextInput
                  value={eventName}
                  onChange={(e) => {
                    setEventName(e.target.value);
                    if (festivalNameError) setFestivalNameError(false);
                  }}
                  placeholder={eventType === 'festival' ? 'e.g., Bonnaroo 2024' : 'e.g., Special event name'}
                  label={eventType === 'festival' ? 'Festival Name *' : 'Event Name'}
                  error={festivalNameError ? 'Festival name is required' : undefined}
                  fullWidth
                />
                {eventType === 'festival' && !eventName && !festivalNameError && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Adding a festival name helps identify this event in your concert history
                  </p>
                )}
              </div>
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
              onClick={() => router.push(`/concerts/${concertId}`)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!isFormValid}
              loading={updateConcert.isPending}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Lineup Suggestion Modal - shown after save if suggestions available */}
      <LineupSuggestionModal
        isOpen={showLineupModal}
        onClose={handleLineupSkip}
        suggestedArtists={lineupData?.artists || []}
        existingArtistMbids={selectedArtists.map((a) => a.artist.mbid)}
        onConfirm={handleLineupConfirm}
        isLoading={addSuggestedArtists.isPending}
        eventDays={lineupData?.eventDays}
        isMultiDay={isMultiDay && lineupData?.isMultiDay}
        queriedDate={lineupData?.queriedDate}
      />
    </div>
  );
}
