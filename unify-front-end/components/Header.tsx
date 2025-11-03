import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AccountSettingsModal from './profile/AccountSettingsModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Header = () => {
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
      <Text style={styles.title}>Unify</Text>
      <TouchableOpacity
        style={styles.profileButton}
        onPress={() => setIsSettingsVisible(true)}
      >
        <Feather name='user' size={20} color='#000' />
      </TouchableOpacity>
      <AccountSettingsModal
        visible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60, // Account for status bar and safe area
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    textTransform: 'lowercase',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});

export default Header;
