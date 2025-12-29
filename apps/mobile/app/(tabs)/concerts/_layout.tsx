import React from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function ConcertsLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Concerts',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Concert Details',
        }}
      />
    </Stack>
  );
}
