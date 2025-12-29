import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/lib/auth/useAuth';

export default function AuthLayout() {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useAuth((state) => state.isAuthenticated);
  const isLoading = useAuth((state) => state.isLoading);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    } else if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#ffffff' },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
