import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  useColorScheme,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Media } from '@/lib/api/hooks/use-media';

interface MediaGridProps {
  media: Media[];
  onEndReached?: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const COLUMNS = 3;
const SPACING = 2;
const ITEM_SIZE = (SCREEN_WIDTH - SPACING * (COLUMNS + 1)) / COLUMNS;

export const MediaGrid: React.FC<MediaGridProps> = ({
  media,
  onEndReached,
  refreshing,
  onRefresh,
}) => {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const renderItem = ({ item }: { item: Media }) => (
    <TouchableOpacity
      onPress={() => router.push(`/media/${item.id}`)}
      activeOpacity={0.8}
      style={styles.item}
    >
      <Image
        source={{ uri: item.thumbnailUrl || item.url }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      {item.type === 'video' && (
        <View style={styles.videoOverlay}>
          <Ionicons name="play-circle" size={32} color="#ffffff" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={media}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={COLUMNS}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING,
  },
  row: {
    justifyContent: 'flex-start',
  },
  item: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: SPACING / 2,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
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
});
