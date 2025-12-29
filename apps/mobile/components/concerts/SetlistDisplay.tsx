import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Card } from '../ui/Card';
import { Colors } from '@/constants/Colors';

interface SetlistDisplayProps {
  setlist: string[];
}

export const SetlistDisplay: React.FC<SetlistDisplayProps> = ({ setlist }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  if (!setlist || setlist.length === 0) {
    return null;
  }

  return (
    <Card>
      <Text style={[styles.title, { color: colors.text }]}>Setlist</Text>
      <View style={styles.list}>
        {setlist.map((song, index) => (
          <View key={index} style={styles.songRow}>
            <Text style={[styles.songNumber, { color: colors.textSecondary }]}>
              {index + 1}.
            </Text>
            <Text style={[styles.songName, { color: colors.text }]}>{song}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  list: {
    gap: 8,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  songNumber: {
    fontSize: 14,
    marginRight: 8,
    minWidth: 24,
  },
  songName: {
    fontSize: 14,
    flex: 1,
  },
});
