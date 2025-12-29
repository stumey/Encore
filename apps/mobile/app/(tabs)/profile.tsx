import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/lib/auth/useAuth';
import { useUser } from '@/lib/api/hooks/use-user';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const signOut = useAuth((state) => state.signOut);
  const { data: user, isLoading } = useUser();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading profile..." />;
  }

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Edit Profile',
      onPress: () => Alert.alert('Coming Soon', 'Profile editing coming soon!'),
    },
    {
      icon: 'musical-note-outline',
      title: 'Artists',
      onPress: () => router.push('/artists'),
    },
    {
      icon: 'location-outline',
      title: 'Venues',
      onPress: () => router.push('/venues'),
    },
    {
      icon: 'settings-outline',
      title: 'Settings',
      onPress: () => Alert.alert('Coming Soon', 'Settings coming soon!'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      onPress: () => Alert.alert('Help', 'Contact support at support@encore.app'),
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <Avatar name={user?.name} size={80} />
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
            <Text style={[styles.email, { color: colors.textSecondary }]}>
              {user?.email}
            </Text>
          </View>
        </View>
      </Card>

      <View style={styles.menu}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <Card style={styles.menuItem}>
              <View style={styles.menuItemContent}>
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={colors.textSecondary}
                />
                <Text style={[styles.menuItemText, { color: colors.text }]}>
                  {item.title}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="outline"
        />
        <Text style={[styles.version, { color: colors.textSecondary }]}>
          Version 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileCard: {
    margin: 16,
  },
  profileHeader: {
    alignItems: 'center',
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
  },
  menu: {
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemText: {
    fontSize: 16,
  },
  footer: {
    padding: 16,
    paddingTop: 8,
    gap: 16,
  },
  version: {
    fontSize: 12,
    textAlign: 'center',
  },
});
