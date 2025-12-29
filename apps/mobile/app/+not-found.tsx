import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';

export default function NotFoundScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>404</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Page not found
      </Text>
      <Button
        title="Go to Home"
        onPress={() => router.replace('/(tabs)')}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 72,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 32,
  },
  button: {
    minWidth: 200,
  },
});
