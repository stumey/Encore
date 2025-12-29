import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Loading } from '@/components/ui/Loading';
import { MediaGrid } from '@/components/media/MediaGrid';
import { Colors } from '@/constants/Colors';
import { useInfiniteMedia } from '@/lib/api/hooks/use-media';

export default function MediaScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    isRefetching,
  } = useInfiniteMedia({ limit: 30 });

  const media = data?.pages.flatMap((page) => page.media) || [];

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading media..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MediaGrid
        media={media}
        onEndReached={handleLoadMore}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/media/upload')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
