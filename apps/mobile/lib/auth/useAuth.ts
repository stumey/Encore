import { create } from 'zustand';
import { cognitoAuth, AuthUser, SignInParams, SignUpParams } from './cognito';
import { secureStorage } from '../storage/secure-store';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  signIn: (params: SignInParams) => Promise<void>;
  signUp: (params: SignUpParams) => Promise<void>;
  signOut: () => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  signIn: async (params: SignInParams) => {
    try {
      set({ isLoading: true, error: null });
      const user = await cognitoAuth.signIn(params);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  signUp: async (params: SignUpParams) => {
    try {
      set({ isLoading: true, error: null });
      await cognitoAuth.signUp(params);
      set({ isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign up';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  confirmSignUp: async (email: string, code: string) => {
    try {
      set({ isLoading: true, error: null });
      await cognitoAuth.confirmSignUp(email, code);
      set({ isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to confirm sign up';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true });
      await cognitoAuth.signOut();
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign out';
      set({ error: message, isLoading: false });
    }
  },

  forgotPassword: async (email: string) => {
    try {
      set({ isLoading: true, error: null });
      await cognitoAuth.forgotPassword(email);
      set({ isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reset code';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  confirmPassword: async (email: string, code: string, newPassword: string) => {
    try {
      set({ isLoading: true, error: null });
      await cognitoAuth.confirmPassword(email, code, newPassword);
      set({ isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset password';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const user = await cognitoAuth.getCurrentUser();
      if (user) {
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
