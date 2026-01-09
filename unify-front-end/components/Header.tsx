import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UnifyLogo from '@/components/icons/UnifyLogo.svg';
import { useUnreadNotificationCount } from '@/hooks/useCommunityNotifications';

interface HeaderProps {
  showSearchIcon?: boolean;
}

const Header = ({ showSearchIcon = true }: HeaderProps) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const unreadCount = useUnreadNotificationCount();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 7}]}>
      <UnifyLogo width={28} height={28} />
      <View style={styles.rightButtons}>
        {showSearchIcon && (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/Gather/SearchScreen')}
          >
            <Feather name='search' size={28} color='#000' />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => router.push('/notifications' as Href)}
          style={styles.bellContainer}
        >
          <Feather name='bell' size={28} color='#000' />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/account-settings')}>
          <Feather name='settings' size={28} color='#000' />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  bellContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#FF7A18',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default Header;

