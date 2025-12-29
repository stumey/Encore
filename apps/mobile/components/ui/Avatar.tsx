import React from 'react';
import { View, Text, Image, StyleSheet, useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

interface AvatarProps {
  name?: string;
  imageUrl?: string;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({ name, imageUrl, size = 40 }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primary,
        },
      ]}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
