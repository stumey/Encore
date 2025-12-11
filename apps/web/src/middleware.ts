import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware for route protection
 *
 * This middleware intercepts requests to protected routes and redirects
 * unauthenticated users to the sign-in page. It uses cookie-based
 * authentication tokens from AWS Cognito.
 */

/**
 * Routes that require authentication
 */
const protectedRoutes = ['/dashboard'];

/**
 * Routes that should redirect to dashboard if user is already authenticated
 */
const authRoutes = ['/auth/signin', '/auth/signup'];

/**
 * Checks if the user has a valid authentication session
 * by looking for Cognito authentication cookies
 */
function isAuthenticated(request: NextRequest): boolean {
  // Check for AWS Cognito tokens in cookies
  // Cognito sets multiple cookies, we check for the access token
  const accessToken = request.cookies.get('CognitoIdentityServiceProvider.accessToken');
  const idToken = request.cookies.get('CognitoIdentityServiceProvider.idToken');

  // Also check for the LastAuthUser cookie which indicates an active session
  const lastAuthUser = request.cookies.get('CognitoIdentityServiceProvider.LastAuthUser');

  // Check for any cookie that starts with the Cognito prefix
  const cognitoCookies = Array.from(request.cookies.getAll()).filter(cookie =>
    cookie.name.includes('CognitoIdentityServiceProvider')
  );

  // User is authenticated if they have Cognito session cookies
  return cognitoCookies.length > 0 || !!(accessToken || idToken || lastAuthUser);
}

/**
 * Middleware function that runs on every request
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(route =>
    pathname.startsWith(route)
  );

  const authenticated = isAuthenticated(request);

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !authenticated) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect authenticated users away from auth pages to dashboard
  if (isAuthRoute && authenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Add security headers to all responses
  const response = NextResponse.next();

  // Prevent clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

/**
 * Configure which routes this middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
