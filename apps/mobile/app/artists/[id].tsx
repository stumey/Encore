import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { ConcertCard } from '@/components/concerts/ConcertCard';
import { Colors } from '@/constants/Colors';
import { useArtist } from '@/lib/api/hooks/use-artists';
import { useConcerts } from '@/lib/api/hooks/use-concerts';

export default function ArtistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { data: artist, isLoading } = useArtist(id);
  const { data: concertsData } = useConcerts({ artistId: id } as any);

  if (isLoading) {
    return <Loading fullScreen text="Loading artist..." />;
  }

  if (!artist) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          Artist not found
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: artist.name,
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <Card style={styles.header}>
          {artist.imageUrl && (
            <Image
              source={{ uri: artist.imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          )}
          <View style={styles.headerContent}>
            <Text style={[styles.name, { color: colors.text }]}>
              {artist.name}
            </Text>
            {artist.genre && (
              <Badge text={artist.genre} variant="primary" style={styles.genre} />
            )}
            {artist._count && (
              <Text style={[styles.stats, { color: colors.textSecondary }]}>
                {artist._count.concerts} {artist._count.concerts === 1 ? 'concert' : 'concerts'}
              </Text>
            )}
          </View>
        </Card>

        {concertsData?.concerts && concertsData.concerts.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Concerts
            </Text>
            {concertsData.concerts.map((concert) => (
              <ConcertCard key={concert.id} concert={concert} />
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    margin: 16,
    alignItems: 'center',
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  genre: {
    marginBottom: 8,
  },
  stats: {
    fontSize: 14,
  },
  section: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
});
