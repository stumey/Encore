import { ReactNode } from 'react';

/**
 * Auth Layout
 *
 * Layout wrapper for authentication pages (signin, signup, forgot-password, callback).
 * Provides consistent styling and structure for all auth-related pages.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {children}
    </div>
  );
}
