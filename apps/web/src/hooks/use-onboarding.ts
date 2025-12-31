'use client';

import { useState, useEffect, useCallback } from 'react';

const ONBOARDING_KEY = 'encore_onboarding_completed';

/**
 * Hook to manage onboarding state
 *
 * Tracks whether user has completed onboarding using localStorage.
 * Shows welcome modal for new users on first dashboard visit.
 */
export function useOnboarding() {
  const [hasCompleted, setHasCompleted] = useState(true); // Default true to prevent flash
  const [isLoaded, setIsLoaded] = useState(false);

  // Check localStorage on mount (client-side only)
  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY) === 'true';
    setHasCompleted(completed);
    setIsLoaded(true);
  }, []);

  // Mark onboarding as complete
  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setHasCompleted(true);
  }, []);

  // Reset onboarding (useful for testing)
  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY);
    setHasCompleted(false);
  }, []);

  return {
    showOnboarding: isLoaded && !hasCompleted,
    completeOnboarding,
    resetOnboarding,
    isLoaded,
  };
}
