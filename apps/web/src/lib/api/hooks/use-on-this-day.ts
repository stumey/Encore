'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { ConcertWithDetails, PaginatedResponse } from '@encore/shared';

/**
 * Get concerts that happened on the same month/day in previous years
 * Fetches all concerts and filters client-side for matching dates
 */
export function useOnThisDay() {
  const now = Date.now();
  const today = new Date(now);
  const [month, day, year] = [today.getMonth() + 1, today.getDate(), today.getFullYear()];

  return useQuery({
    queryKey: ['concerts', 'onThisDay', month, day],
    queryFn: async () => {
      // Fetch all concerts (using a high limit)
      const response = await apiClient.get<PaginatedResponse<ConcertWithDetails>>(
        '/concerts?page=1&limit=1000'
      );

      // Filter for concerts on this month/day from previous years
      const matchingConcerts = response.data.filter((concert) => {
        const concertDate = new Date(concert.concertDate);
        const [concertMonth, concertDay, concertYear] = [
          concertDate.getMonth() + 1,
          concertDate.getDate(),
          concertDate.getFullYear(),
        ];

        // Match month and day, but not current year
        return concertMonth === month && concertDay === day && concertYear < year;
      });

      // Sort by year descending (most recent first)
      return matchingConcerts.sort(
        (a, b) => new Date(b.concertDate).getFullYear() - new Date(a.concertDate).getFullYear()
      );
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour since date won't change
  });
}
