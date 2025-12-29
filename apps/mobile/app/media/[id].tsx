import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Dimensions,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { Colors } from '@/constants/Colors';
import { useMediaItem, useDeleteMedia } from '@/lib/api/hooks/use-media';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function MediaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { data: media, isLoading } = useMediaItem(id);
  const deleteMedia = useDeleteMedia();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Media',
      'Are you sure you want to delete this media? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMedia.mutateAsync(id);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete media');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading media..." />;
  }

  if (!media) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          Media not found
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Media Details',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: media.url }}
            style={styles.image}
            contentFit="contain"
            transition={200}
          />
          {media.type === 'video' && (
            <View style={styles.videoOverlay}>
              <Ionicons name="play-circle" size={64} color="#ffffff" />
            </View>
          )}
        </View>

        {media.concert && (
          <Card style={styles.concertInfo}>
            <TouchableOpacity
              onPress={() => router.push(`/(tabs)/concerts/${media.concert!.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.concertHeader}>
                <View style={styles.concertContent}>
                  <Text style={[styles.concertArtist, { color: colors.text }]}>
                    {media.concert.artist?.name}
                  </Text>
                  <Text style={[styles.concertDate, { color: colors.textSecondary }]}>
                    {formatDate(media.concert.date)}
                  </Text>
                  {media.concert.venue && (
                    <Text style={[styles.concertVenue, { color: colors.textSecondary }]}>
                      {media.concert.venue.name}
                    </Text>
                  )}
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
            </TouchableOpacity>
          </Card>
        )}

        {media.caption && (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Caption</Text>
            <Text style={[styles.caption, { color: colors.text }]}>
              {media.caption}
            </Text>
          </Card>
        )}

        {media.aiAnalysis && (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              AI Analysis
            </Text>

            {media.aiAnalysis.description && (
              <View style={styles.aiSection}>
                <Text style={[styles.aiLabel, { color: colors.textSecondary }]}>
                  Description
                </Text>
                <Text style={[styles.aiText, { color: colors.text }]}>
                  {media.aiAnalysis.description}
                </Text>
              </View>
            )}

            {media.aiAnalysis.tags && media.aiAnalysis.tags.length > 0 && (
              <View style={styles.aiSection}>
                <Text style={[styles.aiLabel, { color: colors.textSecondary }]}>
                  Tags
                </Text>
                <View style={styles.tags}>
                  {media.aiAnalysis.tags.map((tag, index) => (
                    <Badge key={index} text={tag} variant="info" style={styles.tag} />
                  ))}
                </View>
              </View>
            )}

            {media.aiAnalysis.objects && media.aiAnalysis.objects.length > 0 && (
              <View style={styles.aiSection}>
                <Text style={[styles.aiLabel, { color: colors.textSecondary }]}>
                  Detected Objects
                </Text>
                <View style={styles.tags}>
                  {media.aiAnalysis.objects.map((obj, index) => (
                    <Badge
                      key={index}
                      text={obj}
                      variant="success"
                      style={styles.tag}
                    />
                  ))}
                </View>
              </View>
            )}
          </Card>
        )}

        <View style={styles.actions}>
          <Button
            title="Delete"
            onPress={handleDelete}
            variant="outline"
            loading={deleteMedia.isPending}
          />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: '#000',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  concertInfo: {
    margin: 16,
  },
  concertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  concertContent: {
    flex: 1,
  },
  concertArtist: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  concertDate: {
    fontSize: 14,
    marginBottom: 2,
  },
  concertVenue: {
    fontSize: 14,
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
  caption: {
    fontSize: 14,
    lineHeight: 20,
  },
  aiSection: {
    marginBottom: 16,
  },
  aiLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  aiText: {
    fontSize: 14,
    lineHeight: 20,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    marginBottom: 0,
  },
  actions: {
    padding: 16,
    paddingTop: 0,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
});
