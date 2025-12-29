'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Amplify } from 'aws-amplify';
import {
  signIn as amplifySignIn,
  signUp as amplifySignUp,
  signOut as amplifySignOut,
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
  getCurrentUser,
  fetchAuthSession,
  type SignInInput,
  type SignUpInput,
} from 'aws-amplify/auth';
import { amplifyConfig } from './cognito-config';

/**
 * User object representing the authenticated user
 */
export interface User {
  userId: string;
  email?: string;
  emailVerified?: boolean;
  username: string;
}

/**
 * Authentication context value
 */
interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, attributes?: Record<string, string>) => Promise<{
    isSignUpComplete: boolean;
    userId?: string;
    nextStep: { signUpStep: string };
  }>;
  confirmSignUp: (username: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (username: string) => Promise<void>;
  confirmResetPassword: (username: string, code: string, newPassword: string) => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Hook to access authentication context
 * @throws Error if used outside of AuthProvider
 * @returns AuthContextValue
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Authentication Provider Component
 *
 * Wraps the application and provides authentication state and methods
 * using AWS Amplify and Cognito.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configure Amplify on mount
  useEffect(() => {
    try {
      Amplify.configure(amplifyConfig);
    } catch (err) {
      console.error('Failed to configure Amplify:', err);
      setError(err instanceof Error ? err.message : 'Failed to configure authentication');
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetches and sets the current authenticated user
   */
  const fetchCurrentUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();

      setUser({
        userId: currentUser.userId,
        username: currentUser.username,
        email: session.tokens?.idToken?.payload.email as string | undefined,
        emailVerified: session.tokens?.idToken?.payload.email_verified as boolean | undefined,
      });
      setError(null);
    } catch (err) {
      setUser(null);
      // Don't set error for unauthenticated state
      if (err instanceof Error && !err.message.includes('not authenticated')) {
        console.error('Error fetching user:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const signInInput: SignInInput = {
        username: email,
        password,
      };

      const result = await amplifySignIn(signInInput);

      if (result.isSignedIn) {
        await fetchCurrentUser();
      } else {
        throw new Error('Sign in incomplete. Please check your email for verification.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [fetchCurrentUser]);

  /**
   * Sign up with email and password
   */
  const signUpUser = useCallback(async (
    email: string,
    password: string,
    attributes?: Record<string, string>
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const signUpInput: SignUpInput = {
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            ...attributes,
          },
        },
      };

      const result = await amplifySignUp(signUpInput);

      return {
        isSignUpComplete: result.isSignUpComplete,
        userId: result.userId,
        nextStep: result.nextStep,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign up';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Confirm sign up with verification code
   */
  const confirmSignUpUser = useCallback(async (username: string, code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await confirmSignUp({ username, confirmationCode: code });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to confirm sign up';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Sign out the current user
   */
  const signOutUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await amplifySignOut();
      setUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Initiate password reset flow
   */
  const resetPasswordUser = useCallback(async (username: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await resetPassword({ username });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Confirm password reset with code and new password
   */
  const confirmResetPasswordUser = useCallback(async (
    username: string,
    code: string,
    newPassword: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      await confirmResetPassword({
        username,
        confirmationCode: code,
        newPassword,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to confirm password reset';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get the current access token
   */
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.accessToken?.toString() || null;
    } catch (err) {
      console.error('Error fetching access token:', err);
      return null;
    }
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    signIn,
    signUp: signUpUser,
    confirmSignUp: confirmSignUpUser,
    signOut: signOutUser,
    resetPassword: resetPasswordUser,
    confirmResetPassword: confirmResetPasswordUser,
    getAccessToken,
    refreshUser: fetchCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
