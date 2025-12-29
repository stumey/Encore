import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { ConcertCard } from '@/components/concerts/ConcertCard';
import { Colors } from '@/constants/Colors';
import { useInfiniteConcerts } from '@/lib/api/hooks/use-concerts';

export default function ConcertsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [search, setSearch] = useState('');

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    isRefetching,
  } = useInfiniteConcerts({ search, limit: 20 });

  const concerts = data?.pages.flatMap((page) => page.concerts) || [];

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading concerts..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search concerts..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      <FlatList
        data={concerts}
        renderItem={({ item }) => <ConcertCard concert={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={colors.primary}
          />
        }
        ListFooterComponent={
          isFetchingNextPage ? <Loading text="Loading more..." /> : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {search ? 'No concerts found' : 'No concerts yet'}
            </Text>
          </View>
        }
      />
    </View>
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
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});
