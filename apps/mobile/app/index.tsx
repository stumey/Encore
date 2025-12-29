import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth/useAuth';
import { View, ActivityIndicator } from 'react-native';

/**
 * Root index - handles authentication-based routing
 *
 * Redirects users to the appropriate screen based on authentication state:
 * - Authenticated users → main app (tabs)
 * - Unauthenticated users → auth flow (login)
 */
export default function Index() {
  const isAuthenticated = useAuth((state) => state.isAuthenticated);
  const isLoading = useAuth((state) => state.isLoading);
  const checkAuth = useAuth((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Redirect based on authentication state
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
