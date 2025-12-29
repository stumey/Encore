import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

interface LoadingProps {
  text?: string;
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({ text, fullScreen = false }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: fullScreen ? colors.background : 'transparent',
          flex: fullScreen ? 1 : undefined,
        },
      ]}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      {text && (
        <Text style={[styles.text, { color: colors.textSecondary }]}>{text}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 12,
    fontSize: 14,
  },
});
