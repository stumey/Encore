import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { ConcertCard } from '@/components/concerts/ConcertCard';
import { Colors } from '@/constants/Colors';
import { useVenue } from '@/lib/api/hooks/use-venues';
import { useConcerts } from '@/lib/api/hooks/use-concerts';

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { data: venue, isLoading } = useVenue(id);
  const { data: concertsData } = useConcerts({ venueId: id } as any);

  if (isLoading) {
    return <Loading fullScreen text="Loading venue..." />;
  }

  if (!venue) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          Venue not found
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: venue.name,
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <Card style={styles.header}>
          <Text style={[styles.name, { color: colors.text }]}>{venue.name}</Text>
          {venue.city && (
            <Text style={[styles.location, { color: colors.textSecondary }]}>
              {venue.city}
              {venue.state && `, ${venue.state}`}
              {venue.country && `, ${venue.country}`}
            </Text>
          )}
          {venue.address && (
            <Text style={[styles.address, { color: colors.textSecondary }]}>
              {venue.address}
            </Text>
          )}
          {venue.capacity && (
            <Text style={[styles.capacity, { color: colors.textSecondary }]}>
              Capacity: {venue.capacity.toLocaleString()}
            </Text>
          )}
          {venue._count && (
            <Text style={[styles.stats, { color: colors.textSecondary }]}>
              {venue._count.concerts} {venue._count.concerts === 1 ? 'concert' : 'concerts'}
            </Text>
          )}
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
  name: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  location: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  address: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  capacity: {
    fontSize: 14,
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
