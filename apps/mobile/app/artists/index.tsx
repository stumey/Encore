import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import { Stack } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { ArtistCard } from '@/components/artists/ArtistCard';
import { Colors } from '@/constants/Colors';
import { useArtists } from '@/lib/api/hooks/use-artists';

export default function ArtistsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [search, setSearch] = useState('');

  const { data: artists, isLoading, refetch, isRefetching } = useArtists({
    search,
    sortBy: 'concerts',
  });

  if (isLoading) {
    return <Loading fullScreen text="Loading artists..." />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Artists',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.searchContainer}>
          <Input
            placeholder="Search artists..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        <FlatList
          data={artists}
          renderItem={({ item }) => <ArtistCard artist={item} />}
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
                {search ? 'No artists found' : 'No artists yet'}
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
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});
