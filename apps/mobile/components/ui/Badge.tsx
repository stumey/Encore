import React from 'react';
import { View, Text, StyleSheet, ViewStyle, useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

interface BadgeProps {
  text: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ text, variant = 'primary', style }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'error':
        return colors.error;
      case 'info':
        return colors.info;
      default:
        return colors.primary;
    }
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getBackgroundColor() + '20',
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: getBackgroundColor(),
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
