import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Colors } from '@/constants/Colors';
import { Concert } from '@/lib/api/hooks/use-concerts';

interface ConcertCardProps {
  concert: Concert;
}

export const ConcertCard: React.FC<ConcertCardProps> = ({ concert }) => {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handlePress = () => {
    router.push(`/(tabs)/concerts/${concert.id}`);
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {concert.eventType === 'festival' && (
              <Badge text="Festival" variant="info" style={styles.festivalBadge} />
            )}
            <Text style={[styles.artistName, { color: colors.text }]}>
              {concert.eventName || concert.artist?.name}
            </Text>
            <Text style={[styles.date, { color: colors.textSecondary }]}>
              {formatDate(concert.date)}
            </Text>
          </View>
          {concert.rating && (
            <Badge text={`${concert.rating}/5`} variant="primary" />
          )}
        </View>

        <View style={styles.details}>
          <Text style={[styles.venue, { color: colors.text }]} numberOfLines={1}>
            {concert.venue?.name}
          </Text>
          {concert.venue?.city && (
            <Text style={[styles.location, { color: colors.textSecondary }]}>
              {concert.venue.city}
              {concert.venue.state && `, ${concert.venue.state}`}
            </Text>
          )}
        </View>

        {concert._count && concert._count.media > 0 && (
          <View style={styles.footer}>
            <Text style={[styles.mediaCount, { color: colors.textSecondary }]}>
              {concert._count.media} {concert._count.media === 1 ? 'photo' : 'photos'}
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  festivalBadge: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
  },
  details: {
    marginBottom: 8,
  },
  venue: {
    fontSize: 16,
    marginBottom: 2,
  },
  location: {
    fontSize: 14,
  },
  footer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  mediaCount: {
    fontSize: 12,
  },
});
