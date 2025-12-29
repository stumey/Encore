import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { Colors } from '@/constants/Colors';
import { useVenues } from '@/lib/api/hooks/use-venues';
import type { Venue } from '@/lib/api/hooks/use-venues';

const VenueCard = ({ venue }: { venue: Venue }) => {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <TouchableOpacity
      onPress={() => router.push(`/venues/${venue.id}`)}
      activeOpacity={0.7}
    >
      <Card style={styles.venueCard}>
        <View style={styles.venueContent}>
          <View style={styles.venueInfo}>
            <Text style={[styles.venueName, { color: colors.text }]}>
              {venue.name}
            </Text>
            {venue.city && (
              <Text style={[styles.location, { color: colors.textSecondary }]}>
                {venue.city}
                {venue.state && `, ${venue.state}`}
              </Text>
            )}
            {venue._count && venue._count.concerts > 0 && (
              <Badge
                text={`${venue._count.concerts} ${
                  venue._count.concerts === 1 ? 'concert' : 'concerts'
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

export default function VenuesScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [search, setSearch] = useState('');

  const { data: venues, isLoading, refetch, isRefetching } = useVenues({
    search,
    sortBy: 'concerts',
  });

  if (isLoading) {
    return <Loading fullScreen text="Loading venues..." />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Venues',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.searchContainer}>
          <Input
            placeholder="Search venues..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        <FlatList
          data={venues}
          renderItem={({ item }) => <VenueCard venue={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {search ? 'No venues found' : 'No venues yet'}
              </Text>
            </View>
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInput: {
    marginBottom: 0,
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  venueCard: {
    marginBottom: 12,
  },
  venueContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    marginBottom: 8,
  },
  badge: {
    marginTop: 4,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});
