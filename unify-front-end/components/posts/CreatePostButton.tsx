import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100, // Above the bottom navigation
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});

export default function CreatePostButton() {
  const handlePress = () => {
    router.navigate('/create-post');
  };

  return (
    <TouchableOpacity style={styles.floatingButton} onPress={handlePress}>
      <Ionicons name='add' size={24} color='white' />
    </TouchableOpacity>
  );
}
