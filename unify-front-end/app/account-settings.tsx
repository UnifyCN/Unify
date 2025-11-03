import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import BackHeader from '@/components/BackHeader';
import { Avatar } from '@/components/Avatar';
import { useEffect, useState } from 'react';
import { Feather } from '@expo/vector-icons';

export default function AccountSettingsPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        const user = data?.user;
        const name =
          (user?.user_metadata as any)?.full_name || (user?.email ?? '');
        setUserName(name);
        setUserId(user?.id ?? null);
        
        if (user?.id) {
          const { data: profileData } = await supabase
            .from('users')
            .select('profile_picture_url')
            .eq('id', user.id)
            .single();
          if (mounted && profileData) {
            setProfilePictureUrl(profileData.profile_picture_url);
          }
        }
      } catch (err) {
        console.warn('Failed to load user', err);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const onLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
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
            profilePictureUrl={profilePictureUrl ?? undefined}
            username={userName}
            size={80}
            style={styles.avatar}
          />
          <Text style={styles.userName}>{userName}</Text>
        </View>
        <View style={styles.rowsContainer}>
          <View style={styles.settingsCard}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => {
                if (userId) {
                  router.push(`/(tabs)/Gather/Profile/profile?userId=${userId}`);
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
                  router.push(`/(tabs)/Gather/Profile/profile?userId=${userId}&tab=Saved`);
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