import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { SetlistDisplay } from '@/components/concerts/SetlistDisplay';
import { MediaGrid } from '@/components/media/MediaGrid';
import { Colors } from '@/constants/Colors';
import { useConcert, useDeleteConcert } from '@/lib/api/hooks/use-concerts';
import { useMedia } from '@/lib/api/hooks/use-media';

export default function ConcertDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { data: concert, isLoading } = useConcert(id);
  const { data: mediaData } = useMedia({ concertId: id });
  const deleteConcert = useDeleteConcert();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Concert',
      'Are you sure you want to delete this concert? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConcert.mutateAsync(id);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete concert');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading concert..." />;
  }

  if (!concert) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          Concert not found
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Card style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={[styles.artistName, { color: colors.text }]}>
            {concert.artist?.name}
          </Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {formatDate(concert.date)}
          </Text>
        </View>
        {concert.rating && (
          <Badge text={`${concert.rating}/5 ⭐`} variant="primary" />
        )}
      </Card>

      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Venue</Text>
        <Text style={[styles.venueName, { color: colors.text }]}>
          {concert.venue?.name}
        </Text>
        {concert.venue?.city && (
          <Text style={[styles.location, { color: colors.textSecondary }]}>
            {concert.venue.city}
            {concert.venue.state && `, ${concert.venue.state}`}
          </Text>
        )}
      </Card>

      {concert.notes && (
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
          <Text style={[styles.notes, { color: colors.text }]}>
            {concert.notes}
          </Text>
        </Card>
      )}

      {concert.setlist && concert.setlist.length > 0 && (
        <View style={styles.section}>
          <SetlistDisplay setlist={concert.setlist} />
        </View>
      )}

      {mediaData?.media && mediaData.media.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Media ({mediaData.media.length})
          </Text>
          <MediaGrid media={mediaData.media} />
        </View>
      )}

      <View style={styles.actions}>
        <Button
          title="Add Media"
          onPress={() => router.push(`/media/upload?concertId=${id}`)}
          style={styles.actionButton}
        />
        <Button
          title="Delete Concert"
          onPress={handleDelete}
          variant="outline"
          loading={deleteConcert.isPending}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    margin: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
  },
  artistName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  venueName: {
    fontSize: 18,
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
  },
  notes: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
});
