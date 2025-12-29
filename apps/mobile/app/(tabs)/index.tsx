import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { ConcertCard } from '@/components/concerts/ConcertCard';
import { Colors } from '@/constants/Colors';
import { useConcerts, useConcertStats } from '@/lib/api/hooks/use-concerts';
import { useUser } from '@/lib/api/hooks/use-user';

export default function DashboardScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { data: user, isLoading: userLoading } = useUser();
  const { data: stats, isLoading: statsLoading } = useConcertStats();
  const {
    data: concertsData,
    isLoading: concertsLoading,
    refetch,
    isRefetching,
  } = useConcerts({ limit: 5 });

  const isLoading = userLoading || statsLoading || concertsLoading;

  if (isLoading) {
    return <Loading fullScreen text="Loading dashboard..." />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.text }]}>
          Welcome back, {user?.name?.split(' ')[0] || 'there'}!
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {stats?.totalConcerts || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Concerts
          </Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {stats?.totalArtists || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Artists
          </Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {stats?.totalVenues || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Venues
          </Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {stats?.totalMedia || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Photos
          </Text>
        </Card>
      </View>

      {/* Recent Concerts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Concerts
          </Text>
          <Button
            title="View All"
            variant="ghost"
            size="small"
            onPress={() => router.push('/(tabs)/concerts')}
          />
        </View>

        {concertsData?.concerts && concertsData.concerts.length > 0 ? (
          concertsData.concerts.map((concert) => (
            <ConcertCard key={concert.id} concert={concert} />
          ))
        ) : (
          <Card>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No concerts yet. Start tracking your concert experiences!
            </Text>
            <Button
              title="Add Your First Concert"
              onPress={() => router.push('/concerts/new')}
              style={styles.emptyButton}
            />
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    paddingTop: 8,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 20,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  section: {
    padding: 20,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    marginTop: 8,
  },
});
