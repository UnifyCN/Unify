import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UnifyLogo from '@/components/icons/UnifyLogo.svg';

interface HeaderProps {
  showSearchIcon?: boolean;
}

const Header = ({ showSearchIcon = true }: HeaderProps) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
      <UnifyLogo width={28} height={28} />
      <View style={styles.rightButtons}>
        {showSearchIcon && (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/Gather/SearchScreen')}
          >
            <Feather name='search' size={28} color='#000' />
          </TouchableOpacity>
        )}
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
});

export default Header;
