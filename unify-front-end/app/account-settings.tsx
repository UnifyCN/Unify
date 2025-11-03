import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import BackHeader from '@/components/BackHeader';
import { Avatar } from '@/components/Avatar';
import { useState, useEffect } from 'react';
import { Feather } from '@expo/vector-icons';
import { useUserInfo } from '@/hooks/users/useUserInfo';

export default function AccountSettingsPage() {
  const router = useRouter();
  const { data: userInfo } = useUserInfo();
  const [userId, setUserId] = useState<string | null>(null);

  // Keep track of current user's ID for navigation
  useEffect(() => {
    const getUserId = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data?.user?.id ?? null);
    };
    getUserId();
  });

  const onLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Let AuthWrapper handle the navigation
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return (
    <View style={styles.container}>
      <BackHeader title='Account' onBack={() => router.back()} />
      <View style={styles.content}>
        <View style={styles.profileSection}>
          <Avatar
            profilePictureUrl={userInfo?.profilePictureUrl}
            username={userInfo?.username || ''}
            size={80}
            style={styles.avatar}
          />
          <Text style={styles.userName}>{userInfo?.username || ''}</Text>
        </View>
        <View style={styles.rowsContainer}>
          <View style={styles.settingsCard}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => {
                if (userId) {
                  router.push(`/profile?userId=${userId}`);
                }
              }}
            >
              <Feather name='user' size={30} color='#000' />
              <Text style={styles.rowText}>Gather Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.row}
              onPress={() => {
                if (userId) {
                  router.push(`/profile?userId=${userId}&tab=Saved`);
                }
              }}
            >
              <View style={styles.iconContainer}>
                <Feather name='bookmark' size={30} color='#000' />
              </View>
              <Text style={styles.rowText}>Saved Posts</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />

          <TouchableOpacity style={styles.row} onPress={onLogout}>
            <Text style={[styles.rowText, { color: '#000' }]}>Log out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 20,
  },
  profileSection: {
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  avatarPlaceholderSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e6e6e6',
  },
  settingsCard: {
    flexDirection: 'column',
    gap: 15,
  },
  rowsContainer: {
    flexDirection: 'column',
    gap: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  iconContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowText: {
    fontSize: 16,
    color: '#111',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e4e4e4',
  },
});