import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

interface HeaderProps {
  onProfilePress?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onProfilePress }) => {
  const router = useRouter();

  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      router.push('/(tabs)/Gather/Profile/profile');
    }
  };

  return (
    <View style={styles.header}>
      <Text style={styles.title}>Unify</Text>
      <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
        <Feather name="user" size={20} color="#000" />
      </TouchableOpacity>
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