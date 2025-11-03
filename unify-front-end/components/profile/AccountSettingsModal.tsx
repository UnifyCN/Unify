import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import LanguageIcon from '@/components/icons/LanguageIcon';
import BackHeader from '@/components/BackHeader';
import { Avatar } from '@/components/Avatar';
import { Feather } from '@expo/vector-icons';
interface AccountSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

const AccountSettingsModal = ({
  visible,
  onClose,
}: AccountSettingsModalProps) => {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    null
  );

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
      onClose();
      // Auth state listener will handle redirect to login
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const handleNavigateToProfile = () => {
    if (userId) {
      onClose();
      router.push(`/(tabs)/Gather/Profile/profile?userId=${userId}` as any);
    }
  };

  const handleSavedPress = () => {
    if (userId) {
      onClose();
      router.push({
        pathname: '/(tabs)/Gather/Profile/profile',
        params: { userId, tab: 'Saved' },
      } as any);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType='none'
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <BackHeader title='Account' onBack={onClose} />
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
                onPress={handleNavigateToProfile}
              >
                <Feather name='user' size={30} color='#000' />
                <Text style={styles.rowText}>Community Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.row} onPress={handleSavedPress}>
                <View style={styles.iconContainer}>
                  <Feather name='bookmark' size={30} color='#000' />
                </View>
                <Text style={styles.rowText}>Saved</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />

            <TouchableOpacity style={styles.row} onPress={onLogout}>
              <Text style={[styles.rowText, { color: '#000' }]}>Log out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 24,
  },
  profileSection: {
    alignItems: 'center',
    gap: 15,
  },
  avatar: {},
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111',
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
  icon: {
    width: 20,
    height: 20,
  },
  rowText: {
    fontSize: 18,
    color: '#111',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e4e4e4',
  },
  simpleRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  simpleText: {
    fontSize: 15,
    color: '#333',
  },
});

export default AccountSettingsModal;
