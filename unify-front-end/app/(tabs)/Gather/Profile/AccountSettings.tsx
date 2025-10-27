import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useHeaderVisibility } from '@/components/HeaderVisibilityProvider';
import BackHeader from '@/components/BackHeader';
import LanguageIcon from '@/components/icons/LanguageIcon';

const AccountSettings = () => {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const { setVisible } = useHeaderVisibility();

  useFocusEffect(
    React.useCallback(() => {
      setVisible(false);
      return () => setVisible(true);
    }, [setVisible])
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
      // Auth state listener will handle redirect to login
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const handleNavigateToProfile = () => {
    if (userId) {
      router.push(`/(tabs)/Gather/Profile/profile?userId=${userId}` as any);
    }
  };

  const handleLanguageSettings = () => {
    // Do nothing for now
  };

  return (
    <View style={styles.container}>
      <BackHeader title='Account' />
      <View style={styles.content}>
        <View style={styles.rowsContainer}>
          <View style={styles.settingsCard}>
            <TouchableOpacity
              style={styles.row}
              onPress={handleNavigateToProfile}
            >
              <View style={styles.avatarPlaceholderSmall} />
              <Text style={styles.rowText}>Gather Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.row}
              onPress={handleLanguageSettings}
            >
              <View style={styles.iconContainer}>
                <LanguageIcon />
              </View>
              <Text style={styles.rowText}>Languages</Text>
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
  icon: {
    width: 20,
    height: 20,
  },
  rowText: {
    fontSize: 16,
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

export default AccountSettings;
