/**
 * Authentication Utility Functions
 *
 * Helper functions for common authentication patterns and token management.
 */

import { fetchAuthSession } from 'aws-amplify/auth';

/**
 * Get the current user's ID token payload
 * Contains user attributes like email, email_verified, etc.
 */
export async function getIdTokenPayload() {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.payload || null;
  } catch (error) {
    console.error('Error fetching ID token:', error);
    return null;
  }
}

/**
 * Get the current user's access token as a string
 */
export async function getAccessTokenString(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.accessToken?.toString() || null;
  } catch (error) {
    console.error('Error fetching access token:', error);
    return null;
  }
}

/**
 * Get the current user's ID token as a string
 * Used for authorizing API requests (contains email claim)
 */
export async function getIdTokenString(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || null;
  } catch (error) {
    console.error('Error fetching ID token:', error);
    return null;
  }
}

/**
 * Get authentication headers for API requests
 * Returns headers object with Authorization bearer token
 * Uses ID token which contains email claim required by API
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getIdTokenString();

  if (!token) {
    return {};
  }

  return {
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * Check if the current session is valid
 * Returns true if user has valid tokens
 */
export async function isSessionValid(): Promise<boolean> {
  try {
    const session = await fetchAuthSession();
    return !!(session.tokens?.accessToken && session.tokens?.idToken);
  } catch (error) {
    return false;
  }
}

/**
 * Get the time until token expiration in seconds
 * Returns null if no valid token
 */
export async function getTokenExpirationTime(): Promise<number | null> {
  try {
    const session = await fetchAuthSession();
    const expirationTime = session.tokens?.accessToken?.payload?.exp;

    if (!expirationTime) {
      return null;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return expirationTime - currentTime;
  } catch (error) {
    console.error('Error getting token expiration:', error);
    return null;
  }
}

/**
 * Check if token is about to expire (within 5 minutes)
 * Useful for triggering token refresh
 */
export async function isTokenExpiringSoon(thresholdSeconds: number = 300): Promise<boolean> {
  const expirationTime = await getTokenExpirationTime();

  if (!expirationTime) {
    return true;
  }

  return expirationTime <= thresholdSeconds;
}

/**
 * Create an authenticated fetch wrapper
 * Automatically adds Authorization header to requests
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const authHeaders = await getAuthHeaders();

  const headers = {
    ...authHeaders,
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Password validation utilities
 */
export const passwordValidation = {
  /**
   * Minimum password length
   */
  MIN_LENGTH: 8,

  /**
   * Check if password meets all requirements
   */
  validate(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < this.MIN_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_LENGTH} characters long`);
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Get password strength score (0-4)
   * 0: Very weak, 1: Weak, 2: Fair, 3: Good, 4: Strong
   */
  getStrength(password: string): number {
    let score = 0;

    if (password.length >= this.MIN_LENGTH) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    return Math.min(score, 4);
  },

  /**
   * Get password strength label
   */
  getStrengthLabel(password: string): string {
    const strength = this.getStrength(password);
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return labels[strength];
  },
};

/**
 * Email validation
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format authentication error messages for user display
 */
export function formatAuthError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'An unknown error occurred';
  }

  const message = error.message;

  // Map common Cognito errors to user-friendly messages
  const errorMap: Record<string, string> = {
    'NotAuthorizedException': 'Incorrect email or password',
    'UserNotConfirmedException': 'Please verify your email address',
    'UserNotFoundException': 'No account found with this email',
    'UsernameExistsException': 'An account with this email already exists',
    'InvalidPasswordException': 'Password does not meet requirements',
    'CodeMismatchException': 'Invalid verification code',
    'ExpiredCodeException': 'Verification code has expired',
    'LimitExceededException': 'Too many attempts. Please try again later',
    'InvalidParameterException': 'Invalid input parameters',
    'TooManyRequestsException': 'Too many requests. Please try again later',
  };

  // Check if the error message contains any of the known error types
  for (const [errorType, friendlyMessage] of Object.entries(errorMap)) {
    if (message.includes(errorType)) {
      return friendlyMessage;
    }
  }

  return message;
}

/**
 * Storage utilities for auth-related data
 */
export const authStorage = {
  /**
   * Store redirect URL for post-authentication navigation
   */
  setRedirectUrl(url: string): void {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('auth_redirect_url', url);
    }
  },

  /**
   * Get and clear stored redirect URL
   */
  getAndClearRedirectUrl(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const url = sessionStorage.getItem('auth_redirect_url');
    if (url) {
      sessionStorage.removeItem('auth_redirect_url');
    }
    return url;
  },

  /**
   * Clear all auth-related storage
   */
  clearAll(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_redirect_url');
    }
  },
};
