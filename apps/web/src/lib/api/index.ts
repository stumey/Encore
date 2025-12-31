/**
 * Encore API Client & React Query Hooks
 *
 * This module provides a type-safe API client and React Query hooks
 * for interacting with the Encore API.
 *
 * @example
 * ```tsx
 * import { useCurrentUser, useConcerts } from '@/lib/api';
 *
 * function MyComponent() {
 *   const { data: user, isLoading } = useCurrentUser();
 *   const { data: concerts } = useConcerts(1, 20);
 *
 *   return <div>...</div>;
 * }
 * ```
 */

// Export API client
export { apiClient, api, ApiClient, ApiError } from './client';

// Export user hooks
export {
  useCurrentUser,
  useUpdateProfile,
  useUserStats,
  useUserArtists,
} from './hooks/use-user';

// Export concert hooks
export {
  useConcerts,
  useConcert,
  useCreateConcert,
  useUpdateConcert,
  useDeleteConcert,
} from './hooks/use-concerts';

// Export on-this-day hook
export { useOnThisDay } from './hooks/use-on-this-day';

// Export media hooks
export {
  useMedia,
  useUploadUrl,
  useCreateMedia,
  useAnalyzeMedia,
  useDeleteMedia,
} from './hooks/use-media';

// Export artist hooks
export {
  useArtists,
  useArtist,
  useArtistMedia,
} from './hooks/use-artists';

// Export venue hooks
export {
  useVenues,
  useVenue,
} from './hooks/use-venues';

// Export setlist hooks
export {
  useSetlist,
  useSearchSetlists,
} from './hooks/use-setlists';
