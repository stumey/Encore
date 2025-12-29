import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Colors } from '@/constants/Colors';
import { Artist } from '@/lib/api/hooks/use-artists';

interface ArtistCardProps {
  artist: Artist;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist }) => {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const handlePress = () => {
    router.push(`/artists/${artist.id}`);
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.content}>
          {artist.imageUrl && (
            <Image
              source={{ uri: artist.imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          )}
          <View style={styles.info}>
            <Text style={[styles.name, { color: colors.text }]}>
              {artist.name}
            </Text>
            {artist.genre && (
              <Text style={[styles.genre, { color: colors.textSecondary }]}>
                {artist.genre}
              </Text>
            )}
            {artist._count && artist._count.concerts > 0 && (
              <Badge
                text={`${artist._count.concerts} ${
                  artist._count.concerts === 1 ? 'concert' : 'concerts'
                }`}
                variant="primary"
                style={styles.badge}
              />
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  genre: {
    fontSize: 14,
    marginBottom: 8,
  },
  badge: {
    marginTop: 4,
  },
});
